'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Package } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'
import { Product } from '@/lib/types/keygen'
import { handleCrudError } from '@/lib/utils/error-handling'

interface EditProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductUpdated?: () => void
}

const PLATFORM_OPTIONS = [
  'Windows',
  'macOS', 
  'Linux',
  'iOS',
  'Android',
  'Web',
  'Docker',
  'Cloud'
]

export function EditProductDialog({ 
  product, 
  open, 
  onOpenChange, 
  onProductUpdated 
}: EditProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    url: '',
    distributionStrategy: 'LICENSED' as 'LICENSED' | 'OPEN' | 'CLOSED',
    platforms: [] as string[],
    metadata: ''
  })

  const api = getKeygenApi()

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.attributes.name || '',
        code: product.attributes.code || '',
        url: product.attributes.url || '',
        distributionStrategy: product.attributes.distributionStrategy || 'LICENSED',
        platforms: product.attributes.platforms || [],
        metadata: product.attributes.metadata ? JSON.stringify(product.attributes.metadata, null, 2) : ''
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!product) return

    if (!formData.name.trim()) {
      toast.error('Product name is required')
      return
    }

    try {
      setLoading(true)
      
      let metadata: Record<string, unknown> | undefined
      if (formData.metadata.trim()) {
        try {
          metadata = JSON.parse(formData.metadata)
        } catch {
          toast.error('Invalid JSON format in metadata')
          return
        }
      }

      const productData = {
        name: formData.name.trim(),
        distributionStrategy: formData.distributionStrategy,
        ...(formData.code.trim() && { code: formData.code.trim() }),
        ...(formData.url.trim() && { url: formData.url.trim() }),
        ...(formData.platforms.length > 0 && { platforms: formData.platforms }),
        ...(metadata && { metadata })
      }

      await api.products.update(product.id, productData)

      toast.success('Product updated successfully')
      onOpenChange(false)
      onProductUpdated?.()
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'Product')
    } finally {
      setLoading(false)
    }
  }

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        platforms: [...prev.platforms, platform]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        platforms: prev.platforms.filter(p => p !== platform)
      }))
    }
  }

  const generateCode = () => {
    if (formData.name) {
      const code = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, code }))
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product information and settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., My Awesome App"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-code">Product Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-code"
                    placeholder="e.g., my-awesome-app"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateCode}
                    disabled={!formData.name.trim()}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique identifier for your product
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-url">Product URL</Label>
                <Input
                  id="edit-url"
                  type="url"
                  placeholder="https://myapp.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Website or documentation URL for your product
                </p>
              </div>
            </div>
          </div>

          {/* Distribution Strategy */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Distribution Strategy</h4>
            <div className="space-y-2">
              <Label htmlFor="edit-strategy">Strategy *</Label>
              <Select
                value={formData.distributionStrategy}
                onValueChange={(value: 'LICENSED' | 'OPEN' | 'CLOSED') => setFormData({ ...formData, distributionStrategy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LICENSED">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <div className="font-medium">Licensed</div>
                        <div className="text-xs text-muted-foreground">Requires valid license</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="OPEN">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div>
                        <div className="font-medium">Open</div>
                        <div className="text-xs text-muted-foreground">Freely available to all</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="CLOSED">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div>
                        <div className="font-medium">Closed</div>
                        <div className="text-xs text-muted-foreground">Access restricted</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Supported Platforms */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Supported Platforms</h4>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORM_OPTIONS.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-platform-${platform}`}
                    checked={formData.platforms.includes(platform)}
                    onCheckedChange={(checked) => 
                      handlePlatformToggle(platform, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`edit-platform-${platform}`}
                    className="text-sm font-normal"
                  >
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select all platforms that your product supports
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Metadata (Optional)</h4>
            <div className="space-y-2">
              <Label htmlFor="edit-metadata">Custom Metadata (JSON)</Label>
              <Textarea
                id="edit-metadata"
                placeholder='{&quot;version&quot;: &quot;1.0.0&quot;, &quot;category&quot;: &quot;productivity&quot;}'
                value={formData.metadata}
                onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional JSON metadata for additional product information
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}