'use client'

import { useState, useEffect, useCallback } from 'react'
import { getKeygenApi } from '@/lib/api'
import { License } from '@/lib/types/keygen'
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
  Key,
  Calendar,
  Users,
  Activity,
  Pause,
  Play,
  Trash2,
  Edit,
  Copy,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError, handleCrudError } from '@/lib/utils/error-handling'
import { CreateLicenseDialog } from './create-license-dialog'
import { DeleteLicenseDialog } from './delete-license-dialog'
import { EditLicenseDialog } from './edit-license-dialog'

export function LicenseManagement() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const api = getKeygenApi()

  const loadLicenses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.licenses.list({
        limit: 50,
        ...(statusFilter !== 'all' && { status: statusFilter as License['attributes']['status'] })
      })
      setLicenses(response.data || [])
    } catch (error: unknown) {
      handleLoadError(error, 'licenses')
    } finally {
      setLoading(false)
    }
  }, [api.licenses, statusFilter])

  useEffect(() => {
    loadLicenses()
  }, [loadLicenses])

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = !searchTerm || 
      license.attributes.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.attributes.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || license.attributes.status.toLowerCase() === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'suspended': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSuspendLicense = async (license: License) => {
    try {
      await api.licenses.suspend(license.id)
      await loadLicenses()
      toast.success('License suspended successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'License', { customMessage: 'Failed to suspend license' })
    }
  }

  const handleReinstateLicense = async (license: License) => {
    try {
      await api.licenses.reinstate(license.id)
      await loadLicenses()
      toast.success('License reinstated successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'License', { customMessage: 'Failed to reinstate license' })
    }
  }

  const handleRenewLicense = async (license: License) => {
    try {
      await api.licenses.renew(license.id)
      await loadLicenses()
      toast.success('License renewed successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'License', { customMessage: 'Failed to renew license' })
    }
  }

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('License key copied to clipboard')
  }

  const handleDeleteLicense = (license: License) => {
    setSelectedLicense(license)
    setDeleteDialogOpen(true)
  }

  const handleEditLicense = (license: License) => {
    setSelectedLicense(license)
    setEditDialogOpen(true)
  }

  const handleGenerateToken = async (license: License) => {
    try {
      const response = await api.licenses.generateActivationToken(license.id)
      const tokenData = response.data as { attributes?: { token?: string } }
      if (tokenData?.attributes?.token) {
        await navigator.clipboard.writeText(tokenData.attributes.token)
        toast.success('Activation token copied to clipboard')
      } else {
        toast.error('Failed to generate activation token')
      }
    } catch (error: unknown) {
      handleCrudError(error, 'create', 'Activation token', { customMessage: 'Failed to generate activation token' })
    }
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
          <p className="text-muted-foreground">
            Manage and monitor your software licenses
          </p>
        </div>
        <CreateLicenseDialog onLicenseCreated={loadLicenses} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {licenses.filter(l => l.attributes.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active licenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {licenses.filter(l => l.attributes.status === 'expired').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need renewal
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {licenses.reduce((acc, l) => acc + (l.attributes.uses || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total activations
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
              placeholder="Search licenses..."
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
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>License List</CardTitle>
          <CardDescription>
            A list of all licenses in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading licenses...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-muted px-1 rounded">
                          {license.attributes.key.substring(0, 20)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLicenseKey(license.attributes.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {license.attributes.name || 'Unnamed License'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(license.attributes.status)}
                      >
                        {license.attributes.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {license.attributes.uses || 0}
                      {license.attributes.maxUses ? ` / ${license.attributes.maxUses}` : ''}
                    </TableCell>
                    <TableCell>
                      {license.attributes.expiry 
                        ? formatDate(license.attributes.expiry)
                        : 'Never expires'
                      }
                    </TableCell>
                    <TableCell>
                      {formatDate(license.attributes.created)}
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
                          <DropdownMenuItem onClick={() => handleEditLicense(license)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit License
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateToken(license)}>
                            <Download className="mr-2 h-4 w-4" />
                            Generate Token
                          </DropdownMenuItem>
                          {license.attributes.status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => handleSuspendLicense(license)}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleReinstateLicense(license)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Reinstate
                            </DropdownMenuItem>
                          )}
                          {license.attributes.status === 'expired' && (
                            <DropdownMenuItem 
                              onClick={() => handleRenewLicense(license)}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Renew
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteLicense(license)}
                            className="text-destructive"
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
          
          {!loading && filteredLicenses.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Key className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm font-medium">No licenses found</div>
                <div className="text-xs text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first license'
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      {selectedLicense && (
        <DeleteLicenseDialog
          license={selectedLicense}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onLicenseDeleted={loadLicenses}
        />
      )}

      {/* Edit Dialog */}
      {selectedLicense && (
        <EditLicenseDialog
          license={selectedLicense}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onLicenseUpdated={loadLicenses}
        />
      )}
    </div>
  )
}
