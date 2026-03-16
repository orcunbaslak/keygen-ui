'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getKeygenApi } from '@/lib/api'
import { License } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError, handleCrudError } from '@/lib/utils/error-handling'
import { CreateLicenseDialog } from './create-license-dialog'
import { DeleteLicenseDialog } from './delete-license-dialog'
import { EditLicenseDialog } from './edit-license-dialog'

const PAGE_SIZES = [10, 25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export function LicenseManagement() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)

  // Search state
  const [isSearchMode, setIsSearchMode] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS)

  const api = getKeygenApi()

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchTerm('')
        searchInputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Build search query from the search term.
  // Uses OR logic so any matching field returns results.
  const buildSearchQuery = useCallback((term: string) => {
    const query: Record<string, string> = {}
    if (term.length < 3) return query

    // Always search by name (ILIKE substring match)
    query.name = term

    // If it looks like a UUID, search by id
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-/i
    if (uuidPattern.test(term)) {
      query.id = term
    }

    // If it contains hyphens and uppercase (license key pattern), search by key
    if (term.includes('-') && /[A-F0-9]{4,}/.test(term)) {
      query.key = term
    }

    // If it looks like an email, search by user
    if (term.includes('@')) {
      query.user = term
    }

    return query
  }, [])

  // Unified data loader: handles both search and browse modes
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const searchQuery = debouncedSearch ? buildSearchQuery(debouncedSearch) : null
      const hasValidSearch = searchQuery && Object.keys(searchQuery).length > 0

      if (hasValidSearch) {
        // Server-side search via POST /search with pagination
        setIsSearchMode(true)
        const response = await api.search.search<License>({
          type: 'licenses',
          query: searchQuery,
          op: 'OR',
          page: { size: pageSize, number: currentPage },
        })
        setLicenses(response.data || [])
        setTotalCount(response.meta?.count ?? (response.data?.length || 0))
      } else {
        // Normal paginated browsing
        setIsSearchMode(false)
        const response = await api.licenses.list({
          page: { size: pageSize, number: currentPage },
          ...(statusFilter !== 'all' && { status: statusFilter as License['attributes']['status'] })
        })
        setLicenses(response.data || [])
        setTotalCount(response.meta?.count ?? (response.data?.length || 0))
      }
    } catch (error: unknown) {
      handleLoadError(error, 'licenses')
    } finally {
      setLoading(false)
    }
  }, [api.licenses, api.search, pageSize, currentPage, statusFilter, debouncedSearch, buildSearchQuery])

  // Load data whenever dependencies change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, pageSize, debouncedSearch])

  // Display data
  const displayLicenses = licenses
  const displayTotalCount = totalCount
  const totalPages = Math.ceil(totalCount / pageSize)

  const isLoading = loading

  // Refresh handler — used after CRUD operations
  const handleRefresh = useCallback(async () => {
    await loadData()
  }, [loadData])

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
      await handleRefresh()
      toast.success('License suspended successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'License', { customMessage: 'Failed to suspend license' })
    }
  }

  const handleReinstateLicense = async (license: License) => {
    try {
      await api.licenses.reinstate(license.id)
      await handleRefresh()
      toast.success('License reinstated successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'License', { customMessage: 'Failed to reinstate license' })
    }
  }

  const handleRenewLicense = async (license: License) => {
    try {
      await api.licenses.renew(license.id)
      await handleRefresh()
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

  const clearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
    searchInputRef.current?.focus()
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  // Stats from currently loaded page
  const activeCount = licenses.filter(l => l.attributes.status === 'active').length
  const expiredCount = licenses.filter(l => l.attributes.status === 'expired').length
  const totalUsage = licenses.reduce((acc, l) => acc + (l.attributes.uses || 0), 0)

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
        <CreateLicenseDialog onLicenseCreated={handleRefresh} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {isSearchMode ? `${totalCount} matching search` : 'All licenses'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Currently active licenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">Need renewal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">Total activations</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search by key, name, or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 pr-20"
          />
          {searchTerm ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
          {isSearchMode && loading && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>License List</CardTitle>
              <CardDescription>
                {isSearchMode
                  ? `${totalCount} result${totalCount !== 1 ? 's' : ''} for "${debouncedSearch}"`
                  : `${totalCount} license${totalCount !== 1 ? 's' : ''} total`
                }
              </CardDescription>
            </div>
            {isSearchMode && (
              <Badge variant="secondary" className="text-xs">
                Search results
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">License Key</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px] pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-6 w-6 rounded" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-6 w-6 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : displayLicenses.length > 0 ? (
                displayLicenses.map((license) => (
                  <TableRow key={license.id} className="group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
                          {license.attributes.key.substring(0, 20)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyLicenseKey(license.attributes.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {license.attributes.name || (
                        <span className="text-muted-foreground italic">Unnamed</span>
                      )}
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
                      <span className="tabular-nums">
                        {license.attributes.uses || 0}
                        {license.attributes.maxUses ? (
                          <span className="text-muted-foreground"> / {license.attributes.maxUses}</span>
                        ) : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      {license.attributes.expiry
                        ? formatDate(license.attributes.expiry)
                        : <span className="text-muted-foreground">Never</span>
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(license.attributes.created)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>
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
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && displayTotalCount > 0 && (
            <div className="flex items-center justify-between border-t px-6 pt-4 mt-2">
              {/* Left: showing range + page size */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  Showing{' '}
                  <span className="font-medium text-foreground">
                    {Math.min((currentPage - 1) * pageSize + 1, displayTotalCount)}
                  </span>
                  {' '}&ndash;{' '}
                  <span className="font-medium text-foreground">
                    {Math.min(currentPage * pageSize, displayTotalCount)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium text-foreground">{displayTotalCount}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">Rows</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="h-7 w-[62px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map(size => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right: page navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(1)}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(totalPages)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
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
          onLicenseDeleted={handleRefresh}
        />
      )}

      {/* Edit Dialog */}
      {selectedLicense && (
        <EditLicenseDialog
          license={selectedLicense}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onLicenseUpdated={handleRefresh}
        />
      )}
    </div>
  )
}
