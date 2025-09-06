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
import { Textarea } from '@/components/ui/textarea'
import { Edit } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'
import { License } from '@/lib/types/keygen'

interface EditLicenseDialogProps {
  license: License
  open: boolean
  onOpenChange: (open: boolean) => void
  onLicenseUpdated: () => void
}

export function EditLicenseDialog({ 
  license, 
  open, 
  onOpenChange, 
  onLicenseUpdated 
}: EditLicenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    expiry: '',
    maxUses: '',
    metadata: ''
  })
  const api = getKeygenApi()

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && license) {
      setFormData({
        name: license.attributes.name || '',
        expiry: license.attributes.expiry ? license.attributes.expiry.split('T')[0] : '', // Convert to date string
        maxUses: license.attributes.maxUses?.toString() || '',
        metadata: license.attributes.metadata ? JSON.stringify(license.attributes.metadata, null, 2) : ''
      })
    }
  }, [open, license])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const updates: any = {}
      
      // Only include fields that have values or have changed
      if (formData.name.trim() !== (license.attributes.name || '')) {
        updates.name = formData.name.trim() || undefined
      }
      
      if (formData.expiry !== (license.attributes.expiry?.split('T')[0] || '')) {
        updates.expiry = formData.expiry ? new Date(formData.expiry).toISOString() : null
      }
      
      if (formData.maxUses !== (license.attributes.maxUses?.toString() || '')) {
        updates.maxUses = formData.maxUses ? parseInt(formData.maxUses) : null
      }
      
      if (formData.metadata !== (license.attributes.metadata ? JSON.stringify(license.attributes.metadata, null, 2) : '')) {
        if (formData.metadata.trim()) {
          try {
            updates.metadata = JSON.parse(formData.metadata)
          } catch {
            updates.metadata = { notes: formData.metadata }
          }
        } else {
          updates.metadata = {}
        }
      }
      
      // Only make API call if there are actual updates
      if (Object.keys(updates).length > 0) {
        await api.licenses.update(license.id, updates)
        toast.success('License updated successfully')
      } else {
        toast.info('No changes to save')
      }
      
      onLicenseUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Update license error:', error)
      
      if (error.status === 404) {
        toast.error('License not found - it may have been deleted')
      } else if (error.status === 422) {
        toast.error('Invalid data provided - please check your inputs')
      } else if (error.status === 403) {
        toast.error('Permission denied - you do not have permission to update this license')
      } else {
        toast.error(`Failed to update license: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit License
          </DialogTitle>
          <DialogDescription>
            Update license details and settings
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* License Key (Read-only) */}
          <div className="space-y-2">
            <Label>License Key</Label>
            <div className="p-2 bg-muted rounded-md font-mono text-sm">
              {license.attributes.key}
            </div>
            <p className="text-xs text-muted-foreground">
              License keys cannot be changed after creation
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter license name (optional)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              id="expiry"
              type="date"
              value={formData.expiry}
              onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no expiration
            </p>
          </div>

          {/* Max Uses */}
          <div className="space-y-2">
            <Label htmlFor="maxUses">Maximum Uses</Label>
            <Input
              id="maxUses"
              type="number"
              min="0"
              placeholder="Unlimited"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of times this license can be used
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              placeholder='{"key": "value"}'
              value={formData.metadata}
              onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Optional JSON metadata for custom tracking
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update License
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}