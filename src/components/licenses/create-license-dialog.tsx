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
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { Policy, User } from '@/lib/types/keygen'
import { toast } from 'sonner'

interface CreateLicenseDialogProps {
  onLicenseCreated?: () => void
}

export function CreateLicenseDialog({ onLicenseCreated }: CreateLicenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    policyId: '',
    userId: '',
    maxUses: '',
    expiry: undefined as Date | undefined,
    notes: ''
  })

  const api = getKeygenApi()

  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const [policiesResponse, usersResponse] = await Promise.all([
        api.policies.list({ limit: 50 }),
        api.users.list({ limit: 50 })
      ])
      setPolicies(policiesResponse.data || [])
      setUsers(usersResponse.data || [])
    } catch (error: any) {
      console.error('Failed to load initial data:', error)
      toast.error('Failed to load policies and users')
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
      
      await api.licenses.create({
        policyId: formData.policyId,
        userId: formData.userId === "none" ? undefined : formData.userId || undefined,
        name: formData.name || undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiry: formData.expiry ? formData.expiry.toISOString() : undefined,
        metadata: formData.notes ? { notes: formData.notes } : undefined
      })

      toast.success('License created successfully')
      setOpen(false)
      setFormData({
        name: '',
        policyId: '',
        userId: '',
        maxUses: '',
        expiry: undefined,
        notes: ''
      })
      onLicenseCreated?.()
    } catch (error: any) {
      toast.error('Failed to create license: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create License
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New License</DialogTitle>
          <DialogDescription>
            Create a new license for your users. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading policies and users...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">License Name</Label>
              <Input
                id="name"
                placeholder="Optional license name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy">Policy *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user">User (Optional)</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => setFormData({ ...formData, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific user</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.attributes.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="Unlimited"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expiry && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expiry ? format(formData.expiry, "PPP") : "Never expires"}
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this license"
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create License'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}