'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, X, FolderKanban, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { categoriesAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function DeleteCategoryModal({ isOpen, category, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !category) return null

  const hasItems = (category.metadata?.itemCount || 0) > 0
  const canDelete = !hasItems

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('Cannot delete category with items')
      return
    }

    setLoading(true)
    
    try {
      await categoriesAPI.delete(category._id)
      toast.success(`Category "${category.name}" deleted successfully`)
      onSuccess()
      onClose()
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete category'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Delete Category</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are about to delete the following category:
            </p>
            
            {/* Category Info Card */}
            <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                {category.image?.url ? (
                  <img
                    src={category.image.url}
                    alt={category.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FolderKanban className="w-8 h-8 text-primary" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{category.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    /{category.slug}
                  </p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Category Stats */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Items</p>
                  <p className="font-semibold text-lg">
                    {category.metadata?.itemCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={category.isActive ? 'default' : 'secondary'} className="mt-1">
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Deletion Status */}
          {hasItems ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-destructive">Cannot Delete Category</h4>
                  <p className="text-sm text-muted-foreground">
                    This category contains <span className="font-semibold text-foreground">{category.metadata.itemCount} item(s)</span>. 
                    Please move or delete all items before removing this category.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">
                    This action is permanent
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this category cannot be recovered. All category data will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 bg-muted/30">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1" 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            className="flex-1"
            disabled={loading || !canDelete}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Category
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}