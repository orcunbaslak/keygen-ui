'use client'

import { useState, useEffect, useCallback } from 'react'
import { getKeygenApi } from '@/lib/api'
import { User } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Users,
  UserCheck,
  UserX,
  Shield,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Ban,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError, handleCrudError } from '@/lib/utils/error-handling'
import { CreateUserDialog } from './create-user-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const api = getKeygenApi()
  const [confirmBanOpen, setConfirmBanOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [pendingAction, setPendingAction] = useState<'ban' | 'unban' | 'delete' | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.users.list({ limit: 50 })
      setUsers(response.data || [])
    } catch (error: unknown) {
      handleLoadError(error, 'users')
    } finally {
      setLoading(false)
    }
  }, [api.users])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.attributes.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.attributes.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.attributes.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !user.attributes.banned) ||
      (statusFilter === 'banned' && user.attributes.banned)
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (banned: boolean) => {
    return banned 
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-green-100 text-green-800 border-green-200'
  }

  const getStatusIcon = (banned: boolean) => {
    return banned 
      ? <Ban className="h-3 w-3" />
      : <CheckCircle className="h-3 w-3" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleBanUser = (user: User) => {
    setPendingUser(user)
    setPendingAction(user.attributes.banned ? 'unban' : 'ban')
    setConfirmBanOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setPendingUser(user)
    setPendingAction('delete')
    setConfirmDeleteOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingUser || !pendingAction) return
    setConfirmLoading(true)
    try {
      if (pendingAction === 'ban') {
        await api.users.ban(pendingUser.id)
        toast.success('User banned successfully')
      } else if (pendingAction === 'unban') {
        await api.users.unban(pendingUser.id)
        toast.success('User unbanned successfully')
      } else if (pendingAction === 'delete') {
        await api.users.delete(pendingUser.id)
        toast.success('User deleted successfully')
      }
      await loadUsers()
      setConfirmBanOpen(false)
      setConfirmDeleteOpen(false)
      setPendingUser(null)
      setPendingAction(null)
    } catch (error: unknown) {
      const action = pendingAction === 'delete' ? 'delete' : 'update'
      const custom = pendingAction === 'delete' ? 'Failed to delete user' : `Failed to ${pendingAction} user`
      handleCrudError(error, action as 'delete' | 'update', 'User', { customMessage: custom })
    } finally {
      setConfirmLoading(false)
    }
  }

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const getFullName = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    if (firstName) return firstName
    if (lastName) return lastName
    return 'Unknown User'
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <CreateUserDialog onUserCreated={loadUsers} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => !u.attributes.banned).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.attributes.banned).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Banned users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.attributes.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Administrator users
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
              placeholder="Search users..."
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
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            A list of all users in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading users...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-muted text-xs">
                            {getInitials(user.attributes.firstName, user.attributes.lastName, user.attributes.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getFullName(user.attributes.firstName, user.attributes.lastName)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {user.attributes.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.attributes.role === 'admin' ? 'default' : 'secondary'}>
                        {user.attributes.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(user.attributes.banned || false)} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(user.attributes.banned || false)}
                        {user.attributes.banned ? 'Banned' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(user.attributes.created)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.attributes.lastSignedInAt 
                        ? formatDate(user.attributes.lastSignedInAt)
                        : 'Never'
                      }
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
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBanUser(user)}>
                            {user.attributes.banned ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Unban User
                              </>
                            ) : (
                              <>
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user)}
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
          
          {!loading && filteredUsers.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm font-medium">No users found</div>
                <div className="text-xs text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first user'
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmBanOpen}
        onOpenChange={setConfirmBanOpen}
        title={pendingAction === 'unban' ? 'Unban user?' : 'Ban user?'}
        description={pendingUser ? `Are you sure you want to ${pendingAction} ${pendingUser.attributes.email}?` : ''}
        confirmLabel={pendingAction === 'unban' ? 'Unban' : 'Ban'}
        destructive={pendingAction === 'ban'}
        loading={confirmLoading}
        onConfirm={executePendingAction}
      />
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete user?"
        description={pendingUser ? `Are you sure you want to delete ${pendingUser.attributes.email}? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        loading={confirmLoading}
        onConfirm={executePendingAction}
      />
    </div>
  )
}
