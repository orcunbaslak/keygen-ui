'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Group } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Users, Trash2, Edit, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { CreateGroupDialog } from './create-group-dialog'
import { EditGroupDialog } from './edit-group-dialog'
import { DeleteGroupDialog } from './delete-group-dialog'
import { GroupDetailsDialog } from './group-details-dialog'

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  
  const api = getKeygenApi()

  const loadGroups = async () => {
    try {
      const response = await api.groups.list({ limit: 100 })
      setGroups(response.data || [])
    } catch (error: any) {
      console.error('Failed to load groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleEdit = (group: Group) => {
    setSelectedGroup(group)
    setEditDialogOpen(true)
  }

  const handleDelete = (group: Group) => {
    setSelectedGroup(group)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group)
    setDetailsDialogOpen(true)
  }

  const handleGroupCreated = () => {
    setCreateDialogOpen(false)
    loadGroups()
    toast.success('Group created successfully')
  }

  const handleGroupUpdated = () => {
    setEditDialogOpen(false)
    setSelectedGroup(null)
    loadGroups()
    toast.success('Group updated successfully')
  }

  const handleGroupDeleted = () => {
    setDeleteDialogOpen(false)
    setSelectedGroup(null)
    loadGroups()
    toast.success('Group deleted successfully')
  }

  const filteredGroups = groups.filter(group => 
    group.attributes.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Organize users and licenses into groups for easier management
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Groups</CardTitle>
          <CardDescription>Find groups by name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Groups ({filteredGroups.length})
          </CardTitle>
          <CardDescription>
            Manage your groups and their configurations
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
                  <TableHead>Max Licenses</TableHead>
                  <TableHead>Max Machines</TableHead>
                  <TableHead>Max Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No groups match your search.' : 'No groups found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.attributes.name}</TableCell>
                      <TableCell>
                        {group.attributes.maxLicenses ? (
                          <Badge variant="secondary">{group.attributes.maxLicenses}</Badge>
                        ) : (
                          <Badge variant="outline">Unlimited</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.attributes.maxMachines ? (
                          <Badge variant="secondary">{group.attributes.maxMachines}</Badge>
                        ) : (
                          <Badge variant="outline">Unlimited</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.attributes.maxUsers ? (
                          <Badge variant="secondary">{group.attributes.maxUsers}</Badge>
                        ) : (
                          <Badge variant="outline">Unlimited</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(group.attributes.created)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(group)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(group)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(group)} 
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
      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGroupCreated={handleGroupCreated}
      />

      {selectedGroup && (
        <>
          <EditGroupDialog
            group={selectedGroup}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onGroupUpdated={handleGroupUpdated}
          />
          <DeleteGroupDialog
            group={selectedGroup}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onGroupDeleted={handleGroupDeleted}
          />
          <GroupDetailsDialog
            group={selectedGroup}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        </>
      )}
    </div>
  )
}