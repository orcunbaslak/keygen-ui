'use client'

import { useState } from 'react'
import { getKeygenApi } from '@/lib/api'
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
import { handleFormError } from '@/lib/utils/error-handling'

interface CreateWebhookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWebhookCreated: () => void
}

export function CreateWebhookDialog({
  open,
  onOpenChange,
  onWebhookCreated
}: CreateWebhookDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    subscriptions: [] as string[],
    enabled: true
  })

  const api = getKeygenApi()

  // Group events by resource for better organization
  const eventGroups = api.webhooks.getEventsByCategory()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.url.trim()) {
      toast.error('Webhook endpoint URL is required')
      return
    }

    if (formData.subscriptions.length === 0) {
      toast.error('At least one event must be selected')
      return
    }

    // Validate URL format
    try {
      new URL(formData.url.trim())
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setLoading(true)
    
    try {
      await api.webhooks.create({
        url: formData.url.trim(),
        subscriptions: formData.subscriptions,
        enabled: formData.enabled
      })

      // Reset form
      setFormData({
        url: '',
        subscriptions: [],
        enabled: true
      })
      
      onWebhookCreated()
    } catch (error: unknown) {
      handleFormError(error, 'Webhook')
    } finally {
      setLoading(false)
    }
  }

  const handleEventToggle = (event: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subscriptions: checked
        ? [...prev.subscriptions, event]
        : prev.subscriptions.filter(e => e !== event)
    }))
  }

  const handleSelectAllInGroup = (groupEvents: string[], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subscriptions: checked
        ? [...new Set([...prev.subscriptions, ...groupEvents])]
        : prev.subscriptions.filter(e => !groupEvents.includes(e))
    }))
  }

  const isGroupFullySelected = (groupEvents: string[]) => {
    return groupEvents.every(event => formData.subscriptions.includes(event))
  }

  const isGroupPartiallySelected = (groupEvents: string[]) => {
    return groupEvents.some(event => formData.subscriptions.includes(event)) &&
           !isGroupFullySelected(groupEvents)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook endpoint to receive real-time event notifications.
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
                  <Label htmlFor="url">Webhook URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
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
                  <Label htmlFor="enabled">Enable webhook immediately</Label>
                </div>
              </CardContent>
            </Card>

            {/* Event Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Event Subscriptions</CardTitle>
                <CardDescription>
                  Select which events should trigger this webhook ({formData.subscriptions.length} selected)
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
                            ref={(el: HTMLButtonElement | null) => {
                              if (el) {
                                const input = el.querySelector('input')
                                if (input) {
                                  input.indeterminate = isGroupPartiallySelected(events)
                                }
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
                                checked={formData.subscriptions.includes(event)}
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
            <Button type="submit" disabled={loading || formData.subscriptions.length === 0}>
              {loading ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}