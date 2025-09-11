'use client'

import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'
import { Product } from '@/lib/types/keygen'
import { handleFormError, handleLoadError } from '@/lib/utils/error-handling'
import { useEffect, useCallback } from 'react'

interface CreatePolicyDialogProps {
  onPolicyCreated?: () => void
}

export function CreatePolicyDialog({ onPolicyCreated }: CreatePolicyDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    productId: '',
    duration: '',
    strict: false,
    floating: false,
    concurrent: false,
    protected: false,
    requireHeartbeat: false,
    heartbeatDuration: '3600',
    heartbeatCullStrategy: 'DEACTIVATE_DEAD' as 'DEACTIVATE_DEAD' | 'KEEP_DEAD',
    heartbeatResurrectionStrategy: 'NO_REVIVE' as 'NO_REVIVE' | 'ALWAYS_REVIVE',
    heartbeatBasis: 'FROM_CREATION' as 'FROM_CREATION' | 'FROM_FIRST_VALIDATION',
    machineUniquenessStrategy: 'UNIQUE_PER_LICENSE' as 'UNIQUE_PER_LICENSE' | 'UNIQUE_PER_ACCOUNT',
    machineMatchingStrategy: 'MATCH_ANY' as 'MATCH_ANY' | 'MATCH_TWO' | 'MATCH_MOST' | 'MATCH_ALL',
    expirationStrategy: 'RESTRICT_ACCESS' as 'RESTRICT_ACCESS' | 'REVOKE_ACCESS' | 'MAINTAIN_ACCESS',
    expirationBasis: 'FROM_CREATION' as 'FROM_CREATION' | 'FROM_FIRST_VALIDATION' | 'FROM_FIRST_ACTIVATION' | 'FROM_FIRST_DOWNLOAD' | 'FROM_FIRST_USE',
    renewalBasis: 'FROM_EXPIRY' as 'FROM_EXPIRY' | 'FROM_NOW',
    transferStrategy: 'RESET_EXPIRY' as 'RESET_EXPIRY' | 'KEEP_EXPIRY',
    authenticationStrategy: 'TOKEN' as 'TOKEN' | 'LICENSE' | 'MIXED' | 'NONE',
    machineLeasingStrategy: 'PER_LICENSE' as 'PER_LICENSE' | 'PER_USER' | 'ALWAYS_ALLOW',
    processLeasingStrategy: 'PER_MACHINE' as 'PER_MACHINE' | 'PER_LICENSE' | 'PER_USER' | 'ALWAYS_ALLOW',
    overageStrategy: 'NO_OVERAGE' as 'NO_OVERAGE' | 'ALWAYS_ALLOW_OVERAGE' | 'ALLOW_1_25X_OVERAGE' | 'ALLOW_1_5X_OVERAGE' | 'ALLOW_2X_OVERAGE',
    metadata: ''
  })

  const api = getKeygenApi()

  // Load products when dialog opens
  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true)
      const response = await api.products.list({ limit: 50 })
      setProducts(response.data || [])
    } catch (error: unknown) {
      handleLoadError(error, 'products')
    } finally {
      setProductsLoading(false)
    }
  }, [api.products])

  useEffect(() => {
    if (open && products.length === 0) {
      loadProducts()
    }
  }, [open, products.length, loadProducts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Policy name is required')
      return
    }

    if (!formData.productId) {
      toast.error('Please select a product')
      return
    }

    try {
      setLoading(true)
      
      // Use EXACTLY the same minimal structure that worked in the test
      const policyData: Record<string, unknown> = {
        name: formData.name.trim(),
        productId: formData.productId
      }

      // Only add duration if specified (like in the test)
      if (formData.duration && formData.duration.trim()) {
        policyData.duration = parseInt(formData.duration)
      }
      
      // These might be problematic - let's test without them first
      // if (formData.concurrent) {
      //   policyData.concurrent = true
      // }
      
      // if (formData.protected) {
      //   policyData.protected = true
      // }
      
      // Skip heartbeat for now to isolate the issue
      // if (formData.requireHeartbeat) {
      //   policyData.requireHeartbeat = true
      //   if (formData.heartbeatDuration) {
      //     policyData.heartbeatDuration = parseInt(formData.heartbeatDuration)
      //   }
      //   policyData.heartbeatCullStrategy = formData.heartbeatCullStrategy
      //   policyData.heartbeatResurrectionStrategy = formData.heartbeatResurrectionStrategy  
      //   policyData.heartbeatBasis = formData.heartbeatBasis
      // }

      // Skip all strategy fields for now to test basic creation
      // policyData.machineUniquenessStrategy = formData.machineUniquenessStrategy
      // policyData.machineMatchingStrategy = formData.machineMatchingStrategy
      // policyData.expirationStrategy = formData.expirationStrategy
      // policyData.expirationBasis = formData.expirationBasis
      // policyData.renewalBasis = formData.renewalBasis
      // policyData.transferStrategy = formData.transferStrategy
      // policyData.authenticationStrategy = formData.authenticationStrategy
      // policyData.machineLeasingStrategy = formData.machineLeasingStrategy
      // policyData.processLeasingStrategy = formData.processLeasingStrategy
      // policyData.overageStrategy = formData.overageStrategy

      // Skip metadata for now to keep it minimal like the working test
      // if (formData.metadata) {
      //   try {
      //     policyData.metadata = JSON.parse(formData.metadata)
      //   } catch {
      //     policyData.metadata = { notes: formData.metadata }
      //   }
      // }

      await api.policies.create(policyData as { name: string; productId: string; duration?: number })

      toast.success('Policy created successfully')
      setOpen(false)
      setFormData({
        name: '',
        productId: '',
        duration: '',
        strict: false,
        floating: false,
        concurrent: false,
        protected: false,
        requireHeartbeat: false,
        heartbeatDuration: '3600',
        heartbeatCullStrategy: 'DEACTIVATE_DEAD',
        heartbeatResurrectionStrategy: 'NO_REVIVE',
        heartbeatBasis: 'FROM_CREATION',
        machineUniquenessStrategy: 'UNIQUE_PER_LICENSE',
        machineMatchingStrategy: 'MATCH_ANY',
        expirationStrategy: 'RESTRICT_ACCESS',
        expirationBasis: 'FROM_CREATION',
        renewalBasis: 'FROM_EXPIRY',
        transferStrategy: 'RESET_EXPIRY',
        authenticationStrategy: 'TOKEN',
        machineLeasingStrategy: 'PER_LICENSE',
        processLeasingStrategy: 'PER_MACHINE',
        overageStrategy: 'NO_OVERAGE',
        metadata: ''
      })
      onPolicyCreated?.()
    } catch (error: unknown) {
      handleFormError(error, 'Policy')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
          <DialogDescription>
            Create a new licensing policy with specific rules and constraints for your products.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Standard License Policy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={productsLoading ? "Loading products..." : "Select a product"} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.attributes.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose which product this policy applies to</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 86400 (1 day)"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
              </div>
            </div>
          </div>

          {/* Policy Type */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Policy Type</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="strict" 
                  checked={formData.strict}
                  onCheckedChange={(checked) => setFormData({ ...formData, strict: !!checked })}
                />
                <Label htmlFor="strict">Strict validation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="floating" 
                  checked={formData.floating}
                  onCheckedChange={(checked) => setFormData({ ...formData, floating: !!checked })}
                />
                <Label htmlFor="floating">Floating license</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="concurrent" 
                  checked={formData.concurrent}
                  onCheckedChange={(checked) => setFormData({ ...formData, concurrent: !!checked })}
                />
                <Label htmlFor="concurrent">Allow concurrent usage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="protected" 
                  checked={formData.protected}
                  onCheckedChange={(checked) => setFormData({ ...formData, protected: !!checked })}
                />
                <Label htmlFor="protected">Write-protected</Label>
              </div>
            </div>
          </div>

          {/* Heartbeat Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Heartbeat Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="requireHeartbeat" 
                  checked={formData.requireHeartbeat}
                  onCheckedChange={(checked) => setFormData({ ...formData, requireHeartbeat: !!checked })}
                />
                <Label htmlFor="requireHeartbeat">Require heartbeat</Label>
              </div>
              
              {formData.requireHeartbeat && (
                <div className="grid grid-cols-3 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="heartbeatDuration">Heartbeat Duration (seconds)</Label>
                    <Input
                      id="heartbeatDuration"
                      type="number"
                      value={formData.heartbeatDuration}
                      onChange={(e) => setFormData({ ...formData, heartbeatDuration: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heartbeatCullStrategy">Cull Strategy</Label>
                    <Select
                      value={formData.heartbeatCullStrategy}
                      onValueChange={(value: 'DEACTIVATE_DEAD' | 'KEEP_DEAD') => setFormData({ ...formData, heartbeatCullStrategy: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEACTIVATE_DEAD">Deactivate Dead</SelectItem>
                        <SelectItem value="KEEP_DEAD">Keep Dead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heartbeatBasis">Heartbeat Basis</Label>
                    <Select
                      value={formData.heartbeatBasis}
                      onValueChange={(value: 'FROM_CREATION' | 'FROM_FIRST_VALIDATION') => setFormData({ ...formData, heartbeatBasis: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FROM_CREATION">From Creation</SelectItem>
                        <SelectItem value="FROM_FIRST_VALIDATION">From First Validation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Strategies */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Advanced Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationStrategy">Expiration Strategy</Label>
                <Select
                  value={formData.expirationStrategy}
                  onValueChange={(value: 'RESTRICT_ACCESS' | 'REVOKE_ACCESS' | 'MAINTAIN_ACCESS') => setFormData({ ...formData, expirationStrategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESTRICT_ACCESS">Restrict Access</SelectItem>
                    <SelectItem value="REVOKE_ACCESS">Revoke Access</SelectItem>
                    <SelectItem value="MAINTAIN_ACCESS">Maintain Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authenticationStrategy">Authentication Strategy</Label>
                <Select
                  value={formData.authenticationStrategy}
                  onValueChange={(value: 'TOKEN' | 'LICENSE' | 'MIXED' | 'NONE') => setFormData({ ...formData, authenticationStrategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOKEN">Token</SelectItem>
                    <SelectItem value="LICENSE">License</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="overageStrategy">Overage Strategy</Label>
                <Select
                  value={formData.overageStrategy}
                  onValueChange={(value: 'NO_OVERAGE' | 'ALWAYS_ALLOW_OVERAGE' | 'ALLOW_1_25X_OVERAGE' | 'ALLOW_1_5X_OVERAGE' | 'ALLOW_2X_OVERAGE') => setFormData({ ...formData, overageStrategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO_OVERAGE">No Overage</SelectItem>
                    <SelectItem value="ALLOW_1_25X_OVERAGE">Allow 1.25x Overage</SelectItem>
                    <SelectItem value="ALLOW_1_5X_OVERAGE">Allow 1.5x Overage</SelectItem>
                    <SelectItem value="ALLOW_2X_OVERAGE">Allow 2x Overage</SelectItem>
                    <SelectItem value="ALWAYS_ALLOW_OVERAGE">Always Allow Overage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (Optional)</Label>
            <Textarea
              id="metadata"
              placeholder='{&quot;description&quot;: &quot;Policy description&quot;, &quot;tags&quot;: [&quot;enterprise&quot;]}'
              value={formData.metadata}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, metadata: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Optional JSON metadata for the policy
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
