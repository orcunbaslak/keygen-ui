'use client'

import { useState } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Entitlement } from '@/lib/types/keygen'
import { handleCrudError } from '@/lib/utils/error-handling'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Code } from 'lucide-react'
// Removed toast import - now handled by error utilities

interface DeleteEntitlementDialogProps {
  entitlement: Entitlement
  open: boolean
  onOpenChange: (open: boolean) => void
  onEntitlementDeleted: () => void
}

export function DeleteEntitlementDialog({
  entitlement,
  open,
  onOpenChange,
  onEntitlementDeleted
}: DeleteEntitlementDialogProps) {
  const [loading, setLoading] = useState(false)
  const api = getKeygenApi()

  const handleDelete = async () => {
    setLoading(true)
    
    try {
      await api.entitlements.delete(entitlement.id)
      onEntitlementDeleted()
    } catch (error: unknown) {
      handleCrudError(error, 'delete', 'Entitlement', {
        onNotFound: () => onEntitlementDeleted()
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
            Delete Entitlement
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this entitlement? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Entitlement Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Name:</span>
              <span className="text-sm">{entitlement.attributes.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Code:</span>
              <Badge variant="secondary" className="font-mono text-xs">
                <Code className="h-3 w-3 mr-1" />
                {entitlement.attributes.code}
              </Badge>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> Deleting this entitlement will remove it from all associated 
              licenses. This may affect your users&apos; access to features controlled by this entitlement.
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
            {loading ? 'Deleting...' : 'Delete Entitlement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}