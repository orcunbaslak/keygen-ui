'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Plus, HelpCircle, RefreshCcw, X } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { Entitlement, Group, Policy, User } from '@/lib/types/keygen'
import { toast } from 'sonner'

interface CreateLicenseDialogProps {
  onLicenseCreated?: () => void
}

export function CreateLicenseDialog({ onLicenseCreated }: CreateLicenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    policyId: '',
    userId: '', // owner
    groupId: '',
    key: '',
    protected: true,
    permissions: '',
    expiry: undefined as Date | undefined,
    
  })
  const [metadata, setMetadata] = useState<{ key: string; value: string }[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedEntitlements, setSelectedEntitlements] = useState<string[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [entitlementSearch, setEntitlementSearch] = useState('')

  const api = getKeygenApi()

  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const [policiesResponse, usersResponse, groupsResponse, entitlementsResponse] = await Promise.all([
        api.policies.list({ limit: 100 }),
        api.users.list({ limit: 100 }),
        api.groups.list({ limit: 100 }),
        api.entitlements.list({ limit: 100 }),
      ])
      setPolicies(policiesResponse.data || [])
      setUsers(usersResponse.data || [])
      setGroups(groupsResponse.data || [])
      setEntitlements(entitlementsResponse.data || [])
    } catch (error: any) {
      console.error('Failed to load initial data:', error)
      toast.error('Failed to load initial data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.policyId) {
      toast.error('Please select a policy')
      return
    }

    try {
      setLoading(true)
      
      const createRes = await api.licenses.create({
        policyId: formData.policyId,
        userId: formData.userId === 'none' ? undefined : formData.userId || undefined,
        groupId: formData.groupId === 'none' ? undefined : formData.groupId || undefined,
        name: formData.name || undefined,
        key: formData.key || undefined,
        protected: formData.protected,
        permissions: formData.permissions
          ? formData.permissions.split(',').map((p) => p.trim()).filter(Boolean)
          : undefined,
        expiry: formData.expiry ? formData.expiry.toISOString() : undefined,
        metadata: {
          ...metadata.reduce((acc, kv) => {
            if (kv.key) acc[kv.key] = kv.value
            return acc
          }, {} as Record<string, string>),
        },
      })

      const createdId = createRes.data?.id

      if (createdId && selectedEntitlements.length > 0) {
        await api.licenses.attachEntitlements(createdId, selectedEntitlements)
      }

      if (createdId && selectedUsers.length > 0) {
        // Best-effort: attach users if supported
        try {
          // @ts-ignore - method added to resource
          await api.licenses.attachUsers(createdId, selectedUsers)
        } catch (err) {
          console.warn('Attaching users failed or unsupported:', err)
        }
      }

      toast.success('License created successfully')
      setOpen(false)
      setFormData({
        name: '',
        policyId: '',
        userId: '',
        groupId: '',
        key: '',
        protected: true,
        permissions: '',
        expiry: undefined,
      })
      setMetadata([])
      setSelectedUsers([])
      setSelectedEntitlements([])
      onLicenseCreated?.()
    } catch (error: any) {
      toast.error('Failed to create license: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const randomKey = () => {
    // Simple aesthetically pleasing key generator: 5x5 uppercase blocks
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const block = () => Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
    return [block(), block(), block(), block(), block()].join('-')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create License
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>New License</DialogTitle>
          <DialogDescription>
            Create a license with attributes, metadata, and relationships.
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading policies and users...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Attributes */}
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attributes</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name">Name</Label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <Input
                    id="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="key">Key</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="size-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Manually defining a key is optional</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="key"
                      placeholder="Key"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setFormData({ ...formData, key: randomKey() })} aria-label="Generate key">
                      <RefreshCcw className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Expiry</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Leave blank for no expiry</TooltipContent>
                    </Tooltip>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.expiry && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expiry ? format(formData.expiry, 'PPP') : 'Never expires'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expiry}
                        onSelect={(date) => setFormData({ ...formData, expiry: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mt-6">
                    <Checkbox
                      id="protected"
                      checked={formData.protected}
                      onCheckedChange={(v) => setFormData({ ...formData, protected: Boolean(v) })}
                    />
                    <div className="flex items-center gap-1">
                      <Label htmlFor="protected">Protected</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="size-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Write-protect this license</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="permissions">Permissions</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Comma-separated (e.g., *, machines:read)</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="permissions"
                    placeholder="Enter permissions…"
                    value={formData.permissions}
                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Metadata</div>
              <div className="space-y-2">
                {metadata.length === 0 && (
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setMetadata((m) => [...m, { key: '', value: '' }])}
                  >
                    + New Key/Value Pair
                  </button>
                )}
                {metadata.length > 0 && (
                  <div className="space-y-2">
                    {metadata.map((kv, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <Input
                          className="col-span-5"
                          placeholder="Key"
                          value={kv.key}
                          onChange={(e) => {
                            const next = [...metadata];
                            next[idx] = { ...kv, key: e.target.value };
                            setMetadata(next);
                          }}
                        />
                        <Input
                          className="col-span-6"
                          placeholder="Value"
                          value={kv.value}
                          onChange={(e) => {
                            const next = [...metadata];
                            next[idx] = { ...kv, value: e.target.value };
                            setMetadata(next);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setMetadata((m) => m.filter((_, i) => i !== idx))}
                          aria-label="Remove"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <div>
                      <Button type="button" variant="outline" onClick={() => setMetadata((m) => [...m, { key: '', value: '' }])}>Add Pair</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Relationships */}
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Relationships</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="policy">Policy</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Required</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={formData.policyId}
                    onValueChange={(value) => setFormData({ ...formData, policyId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a policy" />
                    </SelectTrigger>
                    <SelectContent>
                      {policies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.attributes.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="group">Group</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="size-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Choosing a group is optional</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Select
                    value={formData.groupId}
                    onValueChange={(value) => setFormData({ ...formData, groupId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{String(g.attributes.name)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="owner">Owner</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="size-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Choosing an owner is optional</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No owner</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.attributes.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Users multi-select */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Users</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Search for users by ID or email…</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="rounded-md border">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search users…"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-40">
                      <div className="p-2 space-y-2">
                        {users
                          .filter((u) => {
                            const q = userSearch.toLowerCase();
                            const email = String(u.attributes.email || '').toLowerCase();
                            return !q || email.includes(q) || u.id.includes(q);
                          })
                          .map((u) => (
                            <label key={u.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={selectedUsers.includes(u.id)}
                                onCheckedChange={(v) =>
                                  setSelectedUsers((prev) =>
                                    v ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                                  )
                                }
                              />
                              <span>{u.attributes.email}</span>
                            </label>
                          ))}
                        {users.length === 0 && (
                          <div className="text-xs text-muted-foreground">No users found</div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Entitlements multi-select */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-1">
                    <Label>Entitlements</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Entitlements will automatically be inherited from the policy (if any)
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="rounded-md border">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search entitlements…"
                        value={entitlementSearch}
                        onChange={(e) => setEntitlementSearch(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-40">
                      <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {entitlements
                          .filter((ent) => {
                            const q = entitlementSearch.toLowerCase();
                            const name = String(ent.attributes.name || '').toLowerCase();
                            const code = String(ent.attributes.code || '').toLowerCase();
                            return !q || name.includes(q) || code.includes(q) || ent.id.includes(q);
                          })
                          .map((ent) => (
                            <label key={ent.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={selectedEntitlements.includes(ent.id)}
                                onCheckedChange={(v) =>
                                  setSelectedEntitlements((prev) =>
                                    v ? [...prev, ent.id] : prev.filter((id) => id !== ent.id)
                                  )
                                }
                              />
                              <span>
                                {ent.attributes.name}
                                <span className="text-muted-foreground"> · {ent.attributes.code}</span>
                              </span>
                            </label>
                          ))}
                        {entitlements.length === 0 && (
                          <div className="text-xs text-muted-foreground">No entitlements found</div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Create License'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
