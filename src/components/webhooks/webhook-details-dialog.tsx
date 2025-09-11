'use client'

import { useState, useEffect, useCallback } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Webhook } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Webhook as WebhookIcon, Calendar, Info, Activity, TestTube, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError, handleCrudError } from '@/lib/utils/error-handling'

interface WebhookDetailsDialogProps {
  webhook: Webhook
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WebhookDetailsDialog({
  webhook,
  open,
  onOpenChange
}: WebhookDetailsDialogProps) {
  const [deliveries, setDeliveries] = useState<Array<{ id: string; attributes?: { event?: string; created?: string; successful?: boolean } }>>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)
  
  const api = getKeygenApi()

  const loadWebhookDeliveries = useCallback(async () => {
    if (!webhook.id) return

    setLoadingDeliveries(true)
    try {
      const deliveriesResponse = await api.webhooks.getDeliveries(webhook.id, { limit: 10 })
      setDeliveries((deliveriesResponse.data || []) as Array<{ id: string; attributes?: { event?: string; created?: string; successful?: boolean } }>)
    } catch (error: unknown) {
      handleLoadError(error, 'webhook deliveries', { silent: true })
    } finally {
      setLoadingDeliveries(false)
    }
  }, [api.webhooks, webhook.id])

  useEffect(() => {
    if (open && webhook.id) {
      loadWebhookDeliveries()
    }
  }, [open, webhook.id, loadWebhookDeliveries])

  const handleTestWebhook = async () => {
    try {
      await api.webhooks.test(webhook.id)
      toast.success('Test webhook sent successfully')
      // Refresh deliveries to show the test event
      loadWebhookDeliveries()
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'Webhook', {
        customMessage: 'Failed to send test webhook'
      })
    }
  }

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(webhook.attributes.url)
    toast.success('Endpoint URL copied to clipboard')
  }

  const handleCopySigningKey = () => {
    if (webhook.attributes.signingKey) {
      navigator.clipboard.writeText(webhook.attributes.signingKey)
      toast.success('Signing key copied to clipboard')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const groupEventsByResource = (events: string[]) => {
    const groups: Record<string, string[]> = {}
    events.forEach(event => {
      const [resource] = event.split('.')
      if (!groups[resource]) groups[resource] = []
      groups[resource].push(event)
    })
    return groups
  }

  const eventGroups = groupEventsByResource(webhook.attributes.events)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WebhookIcon className="h-5 w-5" />
            Webhook Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this webhook and its delivery history.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Webhook Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Webhook Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {webhook.attributes.url}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyEndpoint}
                      className="h-8"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={webhook.attributes.enabled ? 'default' : 'secondary'}>
                        {webhook.attributes.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                    <p className="text-sm font-mono text-muted-foreground mt-1">{webhook.id}</p>
                  </div>
                </div>

                {webhook.attributes.signingKey && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Signing Key</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                        {webhook.attributes.signingKey.substring(0, 20)}...
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopySigningKey}
                        className="h-8"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(webhook.attributes.created)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Updated</label>
                    <p className="text-sm flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(webhook.attributes.updated)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Event Subscriptions ({webhook.attributes.events.length})</CardTitle>
              <CardDescription>
                Events that will trigger this webhook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(eventGroups).map(([resource, events]) => (
                  <div key={resource}>
                    <h4 className="text-sm font-medium capitalize mb-2">
                      {resource} Events ({events.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {events.map(event => (
                        <Badge key={event} variant="outline" className="text-xs font-mono">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleTestWebhook} className="gap-2">
                <TestTube className="h-4 w-4" />
                Send Test Webhook
              </Button>
            </CardContent>
          </Card>

          {/* Recent Deliveries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Deliveries
              </CardTitle>
              <CardDescription>
                Recent webhook delivery attempts (showing last 10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDeliveries ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : deliveries.length > 0 ? (
                <div className="space-y-2">
                  {deliveries.map((delivery, index) => (
                    <div key={delivery.id || index} className="flex items-center justify-between p-2 border rounded">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {delivery.attributes?.event || 'Unknown Event'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.attributes?.created ? formatDate(delivery.attributes.created) : 'Unknown time'}
                        </p>
                      </div>
                      <Badge variant={delivery.attributes?.successful ? 'default' : 'destructive'}>
                        {delivery.attributes?.successful ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No delivery history available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Webhook deliveries will appear here once events are triggered
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
