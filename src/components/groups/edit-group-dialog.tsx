'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Group } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface EditGroupDialogProps {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupUpdated: () => void
}

export function EditGroupDialog({
  group,
  open,
  onOpenChange,
  onGroupUpdated
}: EditGroupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    maxLicenses: '',
    maxMachines: '',
    maxUsers: ''
  })

  const api = getKeygenApi()

  // Initialize form data when group changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.attributes.name,
        maxLicenses: group.attributes.maxLicenses?.toString() || '',
        maxMachines: group.attributes.maxMachines?.toString() || '',
        maxUsers: group.attributes.maxUsers?.toString() || ''
      })
    }
  }, [group])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    setLoading(true)
    
    try {
      const updates: any = {
        name: formData.name.trim()
      }

      // Add optional limits - use undefined for unlimited (empty string)
      updates.maxLicenses = formData.maxLicenses && parseInt(formData.maxLicenses) > 0 
        ? parseInt(formData.maxLicenses) 
        : undefined
      updates.maxMachines = formData.maxMachines && parseInt(formData.maxMachines) > 0 
        ? parseInt(formData.maxMachines) 
        : undefined
      updates.maxUsers = formData.maxUsers && parseInt(formData.maxUsers) > 0 
        ? parseInt(formData.maxUsers) 
        : undefined

      await api.groups.update(group.id, updates)
      onGroupUpdated()
    } catch (error: any) {
      console.error('Failed to update group:', error)
      if (error.status === 404) {
        toast.error('Group not found - it may have been deleted')
        onGroupUpdated() // Refresh to remove from list
      } else if (error.status === 422) {
        toast.error('Invalid group data - please check your input')
      } else if (error.status === 403) {
        toast.error('Permission denied - insufficient access rights')
      } else {
        toast.error(`Failed to update group: ${error.message || 'Unknown error'}`)
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
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group configuration and limits.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter group name"
                disabled={loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxLicenses">Max Licenses</Label>
              <Input
                id="maxLicenses"
                type="number"
                min="0"
                value={formData.maxLicenses}
                onChange={(e) => handleInputChange('maxLicenses', e.target.value)}
                placeholder="Leave empty for unlimited"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxMachines">Max Machines</Label>
              <Input
                id="maxMachines"
                type="number"
                min="0"
                value={formData.maxMachines}
                onChange={(e) => handleInputChange('maxMachines', e.target.value)}
                placeholder="Leave empty for unlimited"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input
                id="maxUsers"
                type="number"
                min="0"
                value={formData.maxUsers}
                onChange={(e) => handleInputChange('maxUsers', e.target.value)}
                placeholder="Leave empty for unlimited"
                disabled={loading}
              />
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
              {loading ? 'Updating...' : 'Update Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}