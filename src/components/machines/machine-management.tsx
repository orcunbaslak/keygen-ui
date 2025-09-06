'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Machine } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Monitor,
  Activity,
  AlertCircle,
  CheckCircle,
  Trash2,
  Key,
  Copy,
  Cpu,
} from 'lucide-react'
import { toast } from 'sonner'
import { ActivateMachineDialog } from './activate-machine-dialog'

export function MachineManagement() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const api = getKeygenApi()

  useEffect(() => {
    loadMachines()
  }, [])

  const loadMachines = async () => {
    try {
      setLoading(true)
      const response = await api.machines.list({
        limit: 50,
        ...(statusFilter !== 'all' && { status: statusFilter as any })
      })
      setMachines(response.data || [])
    } catch (error: any) {
      console.error('Failed to load machines:', error)
      toast.error('Failed to load machines')
    } finally {
      setLoading(false)
    }
  }

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = !searchTerm || 
      machine.attributes.fingerprint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.attributes.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.attributes.ip?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && machine.attributes.heartbeatStatus === 'alive') ||
      (statusFilter === 'inactive' && machine.attributes.heartbeatStatus === 'dead') ||
      (statusFilter === 'not-started' && machine.attributes.heartbeatStatus === 'not-started')
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (heartbeatStatus: string) => {
    switch (heartbeatStatus) {
      case 'alive': return 'bg-green-100 text-green-800 border-green-200'
      case 'dead': return 'bg-red-100 text-red-800 border-red-200'
      case 'not-started': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (heartbeatStatus: string) => {
    switch (heartbeatStatus) {
      case 'alive': return <CheckCircle className="h-3 w-3" />
      case 'dead': return <AlertCircle className="h-3 w-3" />
      case 'not-started': return <Activity className="h-3 w-3" />
      default: return <Activity className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteMachine = async (machine: Machine) => {
    if (!confirm('Are you sure you want to delete this machine? This action cannot be undone.')) {
      return
    }

    try {
      await api.machines.deactivate(machine.id)
      await loadMachines()
      toast.success('Machine deleted successfully')
    } catch {
      toast.error('Failed to delete machine')
    }
  }

  const copyFingerprint = (fingerprint: string) => {
    navigator.clipboard.writeText(fingerprint)
    toast.success('Machine fingerprint copied to clipboard')
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success('Machine ID copied to clipboard')
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
          <p className="text-muted-foreground">
            Monitor and manage licensed machines
          </p>
        </div>
        <ActivateMachineDialog onMachineActivated={loadMachines} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{machines.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered machines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {machines.filter(m => m.attributes.heartbeatStatus === 'alive').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {machines.filter(m => m.attributes.heartbeatStatus === 'dead').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Offline machines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {machines.filter(m => m.attributes.heartbeatStatus === 'not-started').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Never activated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Machines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Machine List</CardTitle>
          <CardDescription>
            A list of all registered machines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading machines...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Last Heartbeat</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-muted px-1 rounded">
                          {machine.attributes.fingerprint?.substring(0, 12)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyFingerprint(machine.attributes.fingerprint || '')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {machine.attributes.name || 'Unnamed Machine'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(machine.attributes.heartbeatStatus)} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(machine.attributes.heartbeatStatus)}
                        {machine.attributes.heartbeatStatus?.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {machine.attributes.ip || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {machine.attributes.hostname || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {machine.attributes.lastHeartbeat 
                        ? formatDate(machine.attributes.lastHeartbeat)
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {formatDate(machine.attributes.created)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyId(machine.id)}>
                            <Key className="mr-2 h-4 w-4" />
                            Copy Machine ID
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyFingerprint(machine.attributes.fingerprint || '')}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Fingerprint
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteMachine(machine)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && filteredMachines.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Monitor className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm font-medium">No machines found</div>
                <div className="text-xs text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Machines will appear here when licenses are activated'
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}