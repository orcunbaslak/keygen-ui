'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Webhook } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Webhook as WebhookIcon, Trash2, Edit, Eye, Play, Pause, TestTube } from 'lucide-react'
import { toast } from 'sonner'
import { CreateWebhookDialog } from './create-webhook-dialog'
import { EditWebhookDialog } from './edit-webhook-dialog'
import { DeleteWebhookDialog } from './delete-webhook-dialog'
import { WebhookDetailsDialog } from './webhook-details-dialog'

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [togglingWebhooks, setTogglingWebhooks] = useState<Set<string>>(new Set())
  
  const api = getKeygenApi()

  const loadWebhooks = async () => {
    try {
      const response = await api.webhooks.list({ limit: 100 })
      setWebhooks(response.data || [])
    } catch (error: any) {
      console.error('Failed to load webhooks:', error)
      toast.error('Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWebhooks()
  }, [])

  const handleToggleWebhook = async (webhook: Webhook) => {
    setTogglingWebhooks(prev => new Set(prev).add(webhook.id))
    
    try {
      if (webhook.attributes.enabled) {
        await api.webhooks.disable(webhook.id)
        toast.success('Webhook disabled')
      } else {
        await api.webhooks.enable(webhook.id)
        toast.success('Webhook enabled')
      }
      loadWebhooks()
    } catch (error: any) {
      console.error('Failed to toggle webhook:', error)
      toast.error(`Failed to ${webhook.attributes.enabled ? 'disable' : 'enable'} webhook`)
    } finally {
      setTogglingWebhooks(prev => {
        const next = new Set(prev)
        next.delete(webhook.id)
        return next
      })
    }
  }

  const handleTestWebhook = async (webhook: Webhook) => {
    try {
      await api.webhooks.test(webhook.id)
      toast.success('Test webhook sent successfully')
    } catch (error: any) {
      console.error('Failed to test webhook:', error)
      toast.error('Failed to send test webhook')
    }
  }

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setEditDialogOpen(true)
  }

  const handleDelete = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setDetailsDialogOpen(true)
  }

  const handleWebhookCreated = () => {
    setCreateDialogOpen(false)
    loadWebhooks()
    toast.success('Webhook created successfully')
  }

  const handleWebhookUpdated = () => {
    setEditDialogOpen(false)
    setSelectedWebhook(null)
    loadWebhooks()
    toast.success('Webhook updated successfully')
  }

  const handleWebhookDeleted = () => {
    setDeleteDialogOpen(false)
    setSelectedWebhook(null)
    loadWebhooks()
    toast.success('Webhook deleted successfully')
  }

  const filteredWebhooks = webhooks.filter(webhook => 
    webhook.attributes.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webhook.attributes.events.some(event => event.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhook endpoints to receive real-time event notifications
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Webhooks</CardTitle>
          <CardDescription>Find webhooks by URL or events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search webhooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WebhookIcon className="h-5 w-5" />
            Webhooks ({filteredWebhooks.length})
          </CardTitle>
          <CardDescription>
            Manage webhook endpoints and event subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWebhooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No webhooks match your search.' : 'No webhooks found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWebhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <WebhookIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{webhook.attributes.url}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.attributes.events.slice(0, 3).map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.attributes.events.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{webhook.attributes.events.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={webhook.attributes.enabled}
                            disabled={togglingWebhooks.has(webhook.id)}
                            onCheckedChange={() => handleToggleWebhook(webhook)}
                          />
                          <Badge variant={webhook.attributes.enabled ? 'default' : 'secondary'}>
                            {webhook.attributes.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(webhook.attributes.created)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(webhook)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTestWebhook(webhook)} className="gap-2">
                              <TestTube className="h-4 w-4" />
                              Send Test
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(webhook)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleWebhook(webhook)} 
                              className="gap-2"
                              disabled={togglingWebhooks.has(webhook.id)}
                            >
                              {webhook.attributes.enabled ? (
                                <>
                                  <Pause className="h-4 w-4" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(webhook)} 
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateWebhookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onWebhookCreated={handleWebhookCreated}
      />

      {selectedWebhook && (
        <>
          <EditWebhookDialog
            webhook={selectedWebhook}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onWebhookUpdated={handleWebhookUpdated}
          />
          <DeleteWebhookDialog
            webhook={selectedWebhook}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onWebhookDeleted={handleWebhookDeleted}
          />
          <WebhookDetailsDialog
            webhook={selectedWebhook}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        </>
      )}
    </div>
  )
}