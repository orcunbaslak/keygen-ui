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
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'
import { License } from '@/lib/types/keygen'

interface DeleteLicenseDialogProps {
  license: License
  open: boolean
  onOpenChange: (open: boolean) => void
  onLicenseDeleted: () => void
}

export function DeleteLicenseDialog({ 
  license, 
  open, 
  onOpenChange, 
  onLicenseDeleted 
}: DeleteLicenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const api = getKeygenApi()

  const handleDelete = async () => {
    try {
      setLoading(true)
      await api.licenses.delete(license.id)
      toast.success('License deleted successfully')
      onLicenseDeleted()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Delete license error:', error)
      
      // Handle specific error cases
      if (error.status === 404) {
        toast.error('License not found - it may have already been deleted')
        onLicenseDeleted() // Refresh the list
      } else if (error.status === 422) {
        toast.error('Cannot delete license - it may be in use or have active machines')
      } else if (error.status === 403) {
        toast.error('Permission denied - you do not have permission to delete this license')
      } else {
        toast.error(`Failed to delete license: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete License</DialogTitle>
              <DialogDescription>
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-800">
                  You are about to delete the license:
                </p>
                <div className="rounded bg-white border p-3 space-y-1">
                  <div className="font-medium text-sm">
                    {license.attributes.name || 'Unnamed License'}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Key: {license.attributes.key.substring(0, 20)}...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {license.id}
                  </div>
                </div>
                <p className="text-sm text-red-700">
                  This will permanently remove the license and automatically delete all associated machines. 
                  Users will lose access immediately and cannot reactivate using this license key.
                </p>
              </div>
            </div>
          </div>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete License
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}