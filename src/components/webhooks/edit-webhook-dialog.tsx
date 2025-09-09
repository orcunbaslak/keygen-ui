'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Webhook } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface EditWebhookDialogProps {
  webhook: Webhook
  open: boolean
  onOpenChange: (open: boolean) => void
  onWebhookUpdated: () => void
}

export function EditWebhookDialog({
  webhook,
  open,
  onOpenChange,
  onWebhookUpdated
}: EditWebhookDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    endpoint: '',
    events: [] as string[],
    enabled: true
  })

  const api = getKeygenApi()

  // Group events by resource for better organization
  const eventGroups = api.webhooks.getEventsByCategory()

  // Initialize form data when webhook changes
  useEffect(() => {
    if (webhook) {
      setFormData({
        endpoint: webhook.attributes.endpoint,
        events: [...webhook.attributes.events],
        enabled: webhook.attributes.enabled
      })
    }
  }, [webhook])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.endpoint.trim()) {
      toast.error('Webhook endpoint URL is required')
      return
    }

    if (formData.events.length === 0) {
      toast.error('At least one event must be selected')
      return
    }

    // Validate URL format
    try {
      new URL(formData.endpoint.trim())
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setLoading(true)
    
    try {
      await api.webhooks.update(webhook.id, {
        endpoint: formData.endpoint.trim(),
        events: formData.events,
        enabled: formData.enabled
      })
      
      onWebhookUpdated()
    } catch (error: any) {
      console.error('Failed to update webhook:', error)
      if (error.status === 404) {
        toast.error('Webhook not found - it may have been deleted')
        onWebhookUpdated() // Refresh to remove from list
      } else if (error.status === 422) {
        toast.error('Invalid webhook data - check URL and events')
      } else if (error.status === 403) {
        toast.error('Permission denied - insufficient access rights')
      } else {
        toast.error(`Failed to update webhook: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEventToggle = (event: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      events: checked 
        ? [...prev.events, event]
        : prev.events.filter(e => e !== event)
    }))
  }

  const handleSelectAllInGroup = (groupEvents: string[], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      events: checked
        ? [...new Set([...prev.events, ...groupEvents])]
        : prev.events.filter(e => !groupEvents.includes(e))
    }))
  }

  const isGroupFullySelected = (groupEvents: string[]) => {
    return groupEvents.every(event => formData.events.includes(event))
  }

  const isGroupPartiallySelected = (groupEvents: string[]) => {
    return groupEvents.some(event => formData.events.includes(event)) && 
           !isGroupFullySelected(groupEvents)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>
              Update webhook endpoint configuration and event subscriptions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="endpoint">Webhook Endpoint URL *</Label>
                  <Input
                    id="endpoint"
                    type="url"
                    value={formData.endpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="https://your-app.com/webhooks/keygen"
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The URL where webhook events will be sent via HTTP POST.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(enabled) => setFormData(prev => ({ ...prev, enabled }))}
                    disabled={loading}
                  />
                  <Label htmlFor="enabled">Enable webhook</Label>
                </div>
              </CardContent>
            </Card>

            {/* Event Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Event Subscriptions</CardTitle>
                <CardDescription>
                  Select which events should trigger this webhook ({formData.events.length} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {Object.entries(eventGroups).map(([resource, events]) => (
                      <div key={resource} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${resource}-all`}
                            checked={isGroupFullySelected(events)}
                            onCheckedChange={(checked) => handleSelectAllInGroup(events, checked as boolean)}
                            ref={(el: any) => {
                              if (el) {
                                el.indeterminate = isGroupPartiallySelected(events)
                              }
                            }}
                          />
                          <Label htmlFor={`${resource}-all`} className="text-sm font-medium capitalize">
                            {resource} Events
                            <Badge variant="outline" className="ml-2">
                              {events.length}
                            </Badge>
                          </Label>
                        </div>
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {events.map(event => (
                            <div key={event} className="flex items-center space-x-2">
                              <Checkbox
                                id={event}
                                checked={formData.events.includes(event)}
                                onCheckedChange={(checked) => handleEventToggle(event, checked as boolean)}
                              />
                              <Label htmlFor={event} className="text-sm font-mono">
                                {event}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {resource !== Object.keys(eventGroups)[Object.keys(eventGroups).length - 1] && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
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
            <Button type="submit" disabled={loading || formData.events.length === 0}>
              {loading ? 'Updating...' : 'Update Webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}