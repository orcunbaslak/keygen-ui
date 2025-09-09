'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Entitlement } from '@/lib/types/keygen'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, KeyRound, Calendar, Info, Code } from 'lucide-react'
import { toast } from 'sonner'

interface EntitlementDetailsDialogProps {
  entitlement: Entitlement
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EntitlementDetailsDialog({
  entitlement,
  open,
  onOpenChange
}: EntitlementDetailsDialogProps) {
  const [licenses, setLicenses] = useState<any[]>([])
  const [loadingLicenses, setLoadingLicenses] = useState(false)
  
  const api = getKeygenApi()

  const loadEntitlementDetails = async () => {
    if (!entitlement.id) return

    // Load associated licenses
    setLoadingLicenses(true)
    try {
      const licensesResponse = await api.entitlements.getLicenses(entitlement.id, { limit: 10 })
      setLicenses(licensesResponse.data || [])
    } catch (error: any) {
      console.error('Failed to load entitlement licenses:', error)
      toast.error('Failed to load associated licenses')
    } finally {
      setLoadingLicenses(false)
    }
  }

  useEffect(() => {
    if (open && entitlement.id) {
      loadEntitlementDetails()
    }
  }, [open, entitlement.id])

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
            <Shield className="h-5 w-5" />
            Entitlement Details: {entitlement.attributes.name}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this entitlement and its usage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Entitlement Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Entitlement Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{entitlement.attributes.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Code</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      <Code className="h-3 w-3 mr-1" />
                      {entitlement.attributes.code}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="text-sm font-mono text-muted-foreground">{entitlement.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(entitlement.attributes.created)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(entitlement.attributes.updated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Associated Licenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Associated Licenses ({licenses.length})
              </CardTitle>
              <CardDescription>
                Licenses that have this entitlement enabled (showing first 10)
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
                  {licenses.map((license: any) => (
                    <div key={license.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {license.attributes.name || 'Unnamed License'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {license.attributes.key}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={license.attributes.status === 'active' ? 'default' : 'secondary'}>
                            {license.attributes.status}
                          </Badge>
                          {license.attributes.uses !== undefined && (
                            <Badge variant="outline">
                              Uses: {license.attributes.uses}
                              {license.attributes.maxUses ? `/${license.attributes.maxUses}` : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(license.attributes.created).toLocaleDateString()}
                        </p>
                        {license.attributes.expiry && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(license.attributes.expiry).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No licenses are currently using this entitlement
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Licenses with this entitlement will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Information */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Integration Code:</strong> Use the entitlement code{' '}
                  <Badge variant="secondary" className="font-mono text-xs mx-1">
                    {entitlement.attributes.code}
                  </Badge>
                  in your application to check if a license has access to this feature.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Example: Check if a license includes this entitlement before enabling the feature.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}