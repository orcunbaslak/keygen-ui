'use client'

import { useState, useEffect, useCallback } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Group, License, User } from '@/lib/types/keygen'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, KeyRound, Calendar, Info } from 'lucide-react'
// toast not needed; using centralized error handlers
import { handleLoadError } from '@/lib/utils/error-handling'

interface GroupDetailsDialogProps {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupDetailsDialog({
  group,
  open,
  onOpenChange
}: GroupDetailsDialogProps) {
  const [licenses, setLicenses] = useState<License[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingLicenses, setLoadingLicenses] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  const api = getKeygenApi()

  const loadGroupDetails = useCallback(async () => {
    if (!group.id) return

    // Load licenses
    setLoadingLicenses(true)
    try {
      const licensesResponse = await api.groups.getLicenses(group.id, { limit: 10 })
      setLicenses((licensesResponse.data as License[]) || [])
    } catch (error: unknown) {
      handleLoadError(error, 'group licenses')
    } finally {
      setLoadingLicenses(false)
    }

    // Load users
    setLoadingUsers(true)
    try {
      const usersResponse = await api.groups.getUsers(group.id, { limit: 10 })
      setUsers((usersResponse.data as User[]) || [])
    } catch (error: unknown) {
      handleLoadError(error, 'group users')
    } finally {
      setLoadingUsers(false)
    }
  }, [api.groups, group.id])

  useEffect(() => {
    if (open && group.id) {
      loadGroupDetails()
    }
  }, [open, group.id, loadGroupDetails])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Details: {group.attributes.name}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this group and its members.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Group Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Group Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{group.attributes.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm font-mono">{group.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Max Licenses</label>
                  <p className="text-sm">
                    {group.attributes.maxLicenses ? (
                      <Badge variant="secondary">{group.attributes.maxLicenses}</Badge>
                    ) : (
                      <Badge variant="outline">Unlimited</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Max Machines</label>
                  <p className="text-sm">
                    {group.attributes.maxMachines ? (
                      <Badge variant="secondary">{group.attributes.maxMachines}</Badge>
                    ) : (
                      <Badge variant="outline">Unlimited</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Max Users</label>
                  <p className="text-sm">
                    {group.attributes.maxUsers ? (
                      <Badge variant="secondary">{group.attributes.maxUsers}</Badge>
                    ) : (
                      <Badge variant="outline">Unlimited</Badge>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(group.attributes.created)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(group.attributes.updated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Licenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Licenses ({licenses.length})
              </CardTitle>
              <CardDescription>
                Licenses associated with this group (showing first 10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLicenses ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : licenses.length > 0 ? (
                <div className="space-y-2">
                  {licenses.map((license) => (
                    <div key={license.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">
                          {license.attributes.name || 'Unnamed License'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {license.attributes.key}
                        </p>
                      </div>
                      <Badge variant={license.attributes.status === 'active' ? 'default' : 'secondary'}>
                        {license.attributes.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No licenses associated with this group
                </p>
              )}
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users ({users.length})
              </CardTitle>
              <CardDescription>
                Users associated with this group (showing first 10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">
                          {user.attributes.fullName || user.attributes.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.attributes.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{user.attributes.role}</Badge>
                        <Badge variant={user.attributes.status === 'active' ? 'default' : 'secondary'}>
                          {user.attributes.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users associated with this group
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
