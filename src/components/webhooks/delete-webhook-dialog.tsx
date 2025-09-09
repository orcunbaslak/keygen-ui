'use client'

import { useState } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Webhook } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Webhook as WebhookIcon } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteWebhookDialogProps {
  webhook: Webhook
  open: boolean
  onOpenChange: (open: boolean) => void
  onWebhookDeleted: () => void
}

export function DeleteWebhookDialog({
  webhook,
  open,
  onOpenChange,
  onWebhookDeleted
}: DeleteWebhookDialogProps) {
  const [loading, setLoading] = useState(false)
  const api = getKeygenApi()

  const handleDelete = async () => {
    setLoading(true)
    
    try {
      await api.webhooks.delete(webhook.id)
      onWebhookDeleted()
    } catch (error: any) {
      console.error('Failed to delete webhook:', error)
      if (error.status === 404) {
        toast.error('Webhook not found - it may have already been deleted')
        onWebhookDeleted() // Refresh to remove from list
      } else if (error.status === 403) {
        toast.error('Permission denied - insufficient access rights')
      } else {
        toast.error(`Failed to delete webhook: ${error.message || 'Unknown error'}`)
      }
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
            Delete Webhook
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this webhook? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Webhook Info */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <WebhookIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Endpoint:</span>
            </div>
            <p className="text-sm font-mono bg-background p-2 rounded border">
              {webhook.attributes.endpoint}
            </p>
            
            <div>
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={webhook.attributes.enabled ? 'default' : 'secondary'} className="ml-2">
                {webhook.attributes.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div>
              <span className="text-sm font-medium">Events ({webhook.attributes.events.length}):</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {webhook.attributes.events.slice(0, 5).map((event) => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {event}
                  </Badge>
                ))}
                {webhook.attributes.events.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{webhook.attributes.events.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> Deleting this webhook will permanently stop all event 
              notifications to this endpoint. Any applications depending on these webhooks 
              will stop receiving updates.
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
            {loading ? 'Deleting...' : 'Delete Webhook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}