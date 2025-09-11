'use client'

import { useState } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { handleFormError } from '@/lib/utils/error-handling'

interface CreateEntitlementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEntitlementCreated: () => void
}

export function CreateEntitlementDialog({
  open,
  onOpenChange,
  onEntitlementCreated
}: CreateEntitlementDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  })

  const api = getKeygenApi()

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
      await api.entitlements.create({
        name: formData.name.trim(),
        code: formData.code.trim()
      })
      
      // Reset form
      setFormData({
        name: '',
        code: ''
      })
      
      onEntitlementCreated()
    } catch (error: unknown) {
      handleFormError(error, 'Entitlement')
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

  const generateCodeFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  const handleNameChange = (value: string) => {
    handleInputChange('name', value)
    
    // Auto-generate code if code field is empty
    if (!formData.code) {
      handleInputChange('code', generateCodeFromName(value))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Entitlement</DialogTitle>
            <DialogDescription>
              Create a new entitlement to control feature access and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Entitlement Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter entitlement name (e.g., Premium Features)"
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
                placeholder="Enter code (e.g., premium_features)"
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
              {loading ? 'Creating...' : 'Create Entitlement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}