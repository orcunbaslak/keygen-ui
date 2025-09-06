'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from '@/components/ui/badge'
import { Plus, X, Shield, Unlock, Lock } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'

interface CreateProductDialogProps {
  onProductCreated?: () => void
}

export function CreateProductDialog({ onProductCreated }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [platforms, setPlatforms] = useState<string[]>([])
  const [platformInput, setPlatformInput] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    distributionStrategy: 'LICENSED' as 'LICENSED' | 'OPEN' | 'CLOSED',
    metadata: ''
  })

  const api = getKeygenApi()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a product name')
      return
    }

    try {
      setLoading(true)
      
      let metadata: Record<string, any> | undefined
      if (formData.metadata.trim()) {
        try {
          metadata = JSON.parse(formData.metadata)
        } catch {
          toast.error('Invalid JSON format in metadata')
          return
        }
      }

      await api.products.create({
        name: formData.name,
        url: formData.url || undefined,
        distributionStrategy: formData.distributionStrategy,
        platforms: platforms.length > 0 ? platforms : undefined,
        metadata
      })

      toast.success('Product created successfully')
      setOpen(false)
      resetForm()
      onProductCreated?.()
    } catch (error: any) {
      toast.error('Failed to create product: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      distributionStrategy: 'LICENSED',
      metadata: ''
    })
    setPlatforms([])
    setPlatformInput('')
  }

  const addPlatform = () => {
    const platform = platformInput.trim()
    if (platform && !platforms.includes(platform)) {
      setPlatforms([...platforms, platform])
      setPlatformInput('')
    }
  }

  const removePlatform = (platform: string) => {
    setPlatforms(platforms.filter(p => p !== platform))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPlatform()
    }
  }

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'LICENSED': return <Shield className="h-4 w-4" />
      case 'OPEN': return <Unlock className="h-4 w-4" />
      case 'CLOSED': return <Lock className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Create a new product for your licensing system. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Product"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">Distribution Strategy</Label>
              <Select
                value={formData.distributionStrategy}
                onValueChange={(value) => setFormData({ ...formData, distributionStrategy: value as any })}
              >
                <SelectTrigger>
                  {getStrategyIcon(formData.distributionStrategy)}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LICENSED">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Licensed
                    </div>
                  </SelectItem>
                  <SelectItem value="OPEN">
                    <div className="flex items-center gap-2">
                      <Unlock className="h-4 w-4" />
                      Open
                    </div>
                  </SelectItem>
                  <SelectItem value="CLOSED">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Closed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platforms">Platforms</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="platforms"
                  placeholder="e.g., Windows, macOS, Linux"
                  value={platformInput}
                  onChange={(e) => setPlatformInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" onClick={addPlatform} disabled={!platformInput.trim()}>
                  Add
                </Button>
              </div>
              {platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <Badge key={platform} variant="secondary" className="flex items-center gap-1">
                      {platform}
                      <button
                        type="button"
                        onClick={() => removePlatform(platform)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              placeholder='{"version": "1.0.0", "description": "Product description"}'
              value={formData.metadata}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, metadata: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Optional JSON metadata for the product
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}