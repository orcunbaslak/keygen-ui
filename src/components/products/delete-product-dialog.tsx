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
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'
import { Product } from '@/lib/types/keygen'

interface DeleteProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductDeleted?: () => void
}

export function DeleteProductDialog({ 
  product, 
  open, 
  onOpenChange, 
  onProductDeleted 
}: DeleteProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const api = getKeygenApi()

  const handleDelete = async () => {
    if (!product) return

    try {
      setLoading(true)
      
      // First check if product exists by trying to fetch it
      try {
        await api.products.get(product.id)
      } catch (error: any) {
        if (error.status === 404) {
          toast.error('Product not found. It may have already been deleted.')
          onOpenChange(false)
          onProductDeleted?.()
          return
        }
        throw error
      }

      // If product exists, try to delete it
      await api.products.delete(product.id)
      toast.success(`Product "${product.attributes.name}" deleted successfully`)
      onOpenChange(false)
      onProductDeleted?.()
    } catch (error: any) {
      console.error('Delete failed:', error)
      
      if (error.status === 404) {
        toast.error('Product not found. It may have already been deleted.')
        onOpenChange(false)
        onProductDeleted?.() // Still refresh the list
      } else if (error.status === 422) {
        toast.error('Cannot delete product. It may have associated licenses or policies.')
      } else if (error.status === 403) {
        toast.error('You do not have permission to delete this product.')
      } else {
        toast.error('Failed to delete product: ' + (error.message || 'Unknown error'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Product
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the product and may affect related licenses and policies.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-destructive mb-1">
                  Are you sure you want to delete &ldquo;{product.attributes.name}&rdquo;?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Product ID: <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">{product.id}</code>
                </p>
                {product.attributes.code && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Code: <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">{product.attributes.code}</code>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              'Deleting...'
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}