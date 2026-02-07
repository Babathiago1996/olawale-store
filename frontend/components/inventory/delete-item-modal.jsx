'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { itemsAPI } from '@/lib/api'
import { toast } from 'sonner'

export function DeleteItemModal({ isOpen, item, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!item?._id) {
      toast.error('Invalid item selected')
      return
    }

    setLoading(true)
    
    try {
      console.log('🗑️ Deleting item:', item._id, item.name)
      
      const response = await itemsAPI.delete(item._id)
      
      console.log('✅ Delete response:', response.data)
      
      toast.success(`${item.name} deleted successfully! 🗑️`, {
        duration: 3000
      })
      
      // ✅ CRITICAL: Close modal BEFORE calling onSuccess
      // This ensures the deleted item is visually gone immediately
      onClose()
      
      // ✅ CRITICAL: Wait a tiny bit for modal close animation
      setTimeout(async () => {
        if (onSuccess) {
          console.log('🔄 Refreshing item list...')
          await onSuccess()
        }
      }, 100)
      
    } catch (error) {
      console.error('❌ Delete error:', error)
      
      let errorMessage = 'Failed to delete item'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage, {
        description: 'Please try again or contact support',
        duration: 5000
      })
      
      setLoading(false) // Only reset loading on error
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen || !item) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="bg-background rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Delete Item</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-destructive/10 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Are you absolutely sure?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete{' '}
                <span className="font-medium text-foreground">{item?.name}</span>{' '}
                from your inventory. This action cannot be undone.
              </p>
              
              {/* Item Details */}
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-medium">{item?.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-medium">
                    {item?.stockQuantity} {item?.unit}
                  </span>
                </div>
                {item?.category?.name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{item.category.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="flex-1" 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Permanently'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}