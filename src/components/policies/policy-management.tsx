'use client'

import { useState, useEffect, useCallback } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Policy } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  MoreVertical,
  Shield,
  Users,
  Settings,
  Trash2,
  Edit,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError } from '@/lib/utils/error-handling'
import { CreatePolicyDialog } from './create-policy-dialog'
import { DeletePolicyDialog } from './delete-policy-dialog'

export function PolicyManagement() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null)
  const api = getKeygenApi()

  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.policies.list({ limit: 50 })
      setPolicies(response.data || [])
    } catch (error: unknown) {
      handleLoadError(error, 'policies')
    } finally {
      setLoading(false)
    }
  }, [api.policies])

  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = !searchTerm || 
      policy.attributes.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'floating' && policy.attributes.floating) ||
      (typeFilter === 'node-locked' && !policy.attributes.floating) ||
      (typeFilter === 'protected' && policy.attributes.protected) ||
      (typeFilter === 'strict' && policy.attributes.strict)
    
    return matchesSearch && matchesType
  })

  const getExpirationText = (duration?: number) => {
    if (!duration) return 'Never expires'
    
    const days = Math.floor(duration / (24 * 60 * 60))
    const hours = Math.floor((duration % (24 * 60 * 60)) / (60 * 60))
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    } else {
      return `${duration} seconds`
    }
  }

  const handleDeletePolicy = (policy: Policy) => {
    setPolicyToDelete(policy)
    setDeleteDialogOpen(true)
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success('Policy ID copied to clipboard')
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policies</h1>
          <p className="text-muted-foreground">
            Manage licensing policies and rules for your products
          </p>
        </div>
        <CreatePolicyDialog onPolicyCreated={loadPolicies} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
            <p className="text-xs text-muted-foreground">
              All licensing policies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Floating Policies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.attributes.floating).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-device licenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.attributes.protected).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Write-protected policies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timed Policies</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.attributes.duration).length}
            </div>
            <p className="text-xs text-muted-foreground">
              With expiration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Policies</SelectItem>
            <SelectItem value="floating">Floating</SelectItem>
            <SelectItem value="node-locked">Node-Locked</SelectItem>
            <SelectItem value="protected">Protected</SelectItem>
            <SelectItem value="strict">Strict</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Policies Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading policies...
                </TableCell>
              </TableRow>
            ) : filteredPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No policies found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{policy.attributes.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {policy.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {policy.attributes.floating && (
                        <Badge variant="outline" className="text-xs">
                          Floating
                        </Badge>
                      )}
                      {policy.attributes.strict && (
                        <Badge variant="outline" className="text-xs">
                          Strict
                        </Badge>
                      )}
                      {policy.attributes.protected && (
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                          Protected
                        </Badge>
                      )}
                      {policy.attributes.requireHeartbeat && (
                        <Badge variant="outline" className="text-xs">
                          Heartbeat
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${policy.attributes.duration ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {getExpirationText(policy.attributes.duration)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {policy.attributes.maxMachines && (
                        <div>Machines: {policy.attributes.maxMachines}</div>
                      )}
                      {policy.attributes.maxProcesses && (
                        <div>Processes: {policy.attributes.maxProcesses}</div>
                      )}
                      {policy.attributes.maxUses && (
                        <div>Uses: {policy.attributes.maxUses}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(policy.attributes.created).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => copyId(policy.id)}>
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Policy
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePolicy(policy)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
      </div>

      {/* Delete Dialog */}
      {policyToDelete && (
        <DeletePolicyDialog
          policy={policyToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onPolicyDeleted={loadPolicies}
        />
      )}
    </div>
  )
}
