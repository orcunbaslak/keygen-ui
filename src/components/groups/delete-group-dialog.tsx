'use client'

import { useState } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Group } from '@/lib/types/keygen'
import { handleCrudError } from '@/lib/utils/error-handling'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
// Removed toast import - now handled by error utilities

interface DeleteGroupDialogProps {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupDeleted: () => void
}

export function DeleteGroupDialog({
  group,
  open,
  onOpenChange,
  onGroupDeleted
}: DeleteGroupDialogProps) {
  const [loading, setLoading] = useState(false)
  const api = getKeygenApi()

  const handleDelete = async () => {
    setLoading(true)
    
    try {
      await api.groups.delete(group.id)
      onGroupDeleted()
    } catch (error: unknown) {
      handleCrudError(error, 'delete', 'Group', {
        onNotFound: () => onGroupDeleted()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Group
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the group &quot;{group.attributes.name}&quot;?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Warning:</strong> Deleting this group will remove all user and license 
              associations. Users and licenses themselves will not be deleted, but they will 
              no longer be part of this group.
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}