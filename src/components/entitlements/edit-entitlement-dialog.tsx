'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Entitlement } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface EditEntitlementDialogProps {
  entitlement: Entitlement
  open: boolean
  onOpenChange: (open: boolean) => void
  onEntitlementUpdated: () => void
}

export function EditEntitlementDialog({
  entitlement,
  open,
  onOpenChange,
  onEntitlementUpdated
}: EditEntitlementDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  })

  const api = getKeygenApi()

  // Initialize form data when entitlement changes
  useEffect(() => {
    if (entitlement) {
      setFormData({
        name: entitlement.attributes.name,
        code: entitlement.attributes.code
      })
    }
  }, [entitlement])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Entitlement name is required')
      return
    }

    if (!formData.code.trim()) {
      toast.error('Entitlement code is required')
      return
    }

    setLoading(true)
    
    try {
      await api.entitlements.update(entitlement.id, {
        name: formData.name.trim(),
        code: formData.code.trim()
      })
      
      onEntitlementUpdated()
    } catch (error: any) {
      console.error('Failed to update entitlement:', error)
      if (error.status === 404) {
        toast.error('Entitlement not found - it may have been deleted')
        onEntitlementUpdated() // Refresh to remove from list
      } else if (error.status === 422) {
        toast.error('Invalid entitlement data - code may already exist')
      } else if (error.status === 403) {
        toast.error('Permission denied - insufficient access rights')
      } else {
        toast.error(`Failed to update entitlement: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Entitlement</DialogTitle>
            <DialogDescription>
              Update the entitlement name and code.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Entitlement Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter entitlement name"
                disabled={loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="code">Entitlement Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Enter code"
                disabled={loading}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this entitlement. Use lowercase letters, numbers, and underscores only.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Entitlement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}