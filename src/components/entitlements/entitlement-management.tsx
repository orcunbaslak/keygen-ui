'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Entitlement } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Shield, Trash2, Edit, Eye, Code } from 'lucide-react'
import { toast } from 'sonner'
import { CreateEntitlementDialog } from './create-entitlement-dialog'
import { EditEntitlementDialog } from './edit-entitlement-dialog'
import { DeleteEntitlementDialog } from './delete-entitlement-dialog'
import { EntitlementDetailsDialog } from './entitlement-details-dialog'

export function EntitlementManagement() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedEntitlement, setSelectedEntitlement] = useState<Entitlement | null>(null)
  
  const api = getKeygenApi()

  const loadEntitlements = async () => {
    try {
      const response = await api.entitlements.list({ limit: 100 })
      setEntitlements(response.data || [])
    } catch (error: any) {
      console.error('Failed to load entitlements:', error)
      toast.error('Failed to load entitlements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntitlements()
  }, [])

  const handleEdit = (entitlement: Entitlement) => {
    setSelectedEntitlement(entitlement)
    setEditDialogOpen(true)
  }

  const handleDelete = (entitlement: Entitlement) => {
    setSelectedEntitlement(entitlement)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (entitlement: Entitlement) => {
    setSelectedEntitlement(entitlement)
    setDetailsDialogOpen(true)
  }

  const handleEntitlementCreated = () => {
    setCreateDialogOpen(false)
    loadEntitlements()
    toast.success('Entitlement created successfully')
  }

  const handleEntitlementUpdated = () => {
    setEditDialogOpen(false)
    setSelectedEntitlement(null)
    loadEntitlements()
    toast.success('Entitlement updated successfully')
  }

  const handleEntitlementDeleted = () => {
    setDeleteDialogOpen(false)
    setSelectedEntitlement(null)
    loadEntitlements()
    toast.success('Entitlement deleted successfully')
  }

  const filteredEntitlements = entitlements.filter(entitlement => 
    entitlement.attributes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entitlement.attributes.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entitlements</h1>
          <p className="text-muted-foreground">
            Manage feature entitlements and permissions for your products
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Entitlement
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Entitlements</CardTitle>
          <CardDescription>Find entitlements by name or code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entitlements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Entitlements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Entitlements ({filteredEntitlements.length})
          </CardTitle>
          <CardDescription>
            Manage feature toggles and permissions
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
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntitlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No entitlements match your search.' : 'No entitlements found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntitlements.map((entitlement) => (
                    <TableRow key={entitlement.id}>
                      <TableCell className="font-medium">{entitlement.attributes.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          <Code className="h-3 w-3 mr-1" />
                          {entitlement.attributes.code}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(entitlement.attributes.created)}</TableCell>
                      <TableCell>{formatDate(entitlement.attributes.updated)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(entitlement)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(entitlement)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(entitlement)} 
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
      <CreateEntitlementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onEntitlementCreated={handleEntitlementCreated}
      />

      {selectedEntitlement && (
        <>
          <EditEntitlementDialog
            entitlement={selectedEntitlement}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onEntitlementUpdated={handleEntitlementUpdated}
          />
          <DeleteEntitlementDialog
            entitlement={selectedEntitlement}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onEntitlementDeleted={handleEntitlementDeleted}
          />
          <EntitlementDetailsDialog
            entitlement={selectedEntitlement}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        </>
      )}
    </div>
  )
}