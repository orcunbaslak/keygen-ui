'use client'

import { useState } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated: () => void
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onGroupCreated
}: CreateGroupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    maxLicenses: '',
    maxMachines: '',
    maxUsers: ''
  })

  const api = getKeygenApi()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    setLoading(true)
    
    try {
      const groupData: any = {
        name: formData.name.trim()
      }

      // Add optional limits if specified
      if (formData.maxLicenses && parseInt(formData.maxLicenses) > 0) {
        groupData.maxLicenses = parseInt(formData.maxLicenses)
      }
      if (formData.maxMachines && parseInt(formData.maxMachines) > 0) {
        groupData.maxMachines = parseInt(formData.maxMachines)
      }
      if (formData.maxUsers && parseInt(formData.maxUsers) > 0) {
        groupData.maxUsers = parseInt(formData.maxUsers)
      }

      await api.groups.create(groupData)
      
      // Reset form
      setFormData({
        name: '',
        maxLicenses: '',
        maxMachines: '',
        maxUsers: ''
      })
      
      onGroupCreated()
    } catch (error: any) {
      console.error('Failed to create group:', error)
      if (error.status === 422) {
        toast.error('Invalid group data - please check your input')
      } else if (error.status === 403) {
        toast.error('Permission denied - insufficient access rights')
      } else {
        toast.error(`Failed to create group: ${error.message || 'Unknown error'}`)
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
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize users and licenses.
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
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}