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
import { Policy } from '@/lib/types/keygen'
import { handleCrudError } from '@/lib/utils/error-handling'

interface DeletePolicyDialogProps {
  policy: Policy
  open: boolean
  onOpenChange: (open: boolean) => void
  onPolicyDeleted: () => void
}

export function DeletePolicyDialog({ 
  policy, 
  open, 
  onOpenChange, 
  onPolicyDeleted 
}: DeletePolicyDialogProps) {
  const [loading, setLoading] = useState(false)
  const api = getKeygenApi()

  const handleDelete = async () => {
    try {
      setLoading(true)
      await api.policies.delete(policy.id)
      toast.success('Policy deleted successfully')
      onPolicyDeleted()
      onOpenChange(false)
    } catch (error: unknown) {
      handleCrudError(error, 'delete', 'Policy', {
        onNotFound: () => onPolicyDeleted()
      })
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
              <DialogTitle>Delete Policy</DialogTitle>
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
                  You are about to delete the policy:
                </p>
                <div className="rounded bg-white border p-2">
                  <div className="font-medium text-sm">{policy.attributes.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{policy.id}</div>
                </div>
                <p className="text-sm text-red-700">
                  This will permanently remove the policy and may affect any licenses that depend on it.
                  Make sure no active licenses are using this policy before deletion.
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
                Delete Policy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}