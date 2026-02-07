'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, FolderKanban, Edit, Trash2, ImageIcon, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { categoriesAPI } from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import { CreateCategoryModal } from '@/components/categories/create-category-modal'
import { EditCategoryModal } from '@/components/categories/edit-category-modal'
import { DeleteCategoryModal } from '@/components/categories/delete-category-modal'
import Image from 'next/image'

const CategoryCard = ({ category, onEdit, onDelete, canEdit }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  
  const hasValidImage = category.image && category.image.url && !imageError

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden h-full group">
        <Badge
          variant={category.isActive ? 'default' : 'secondary'}
          className="absolute top-3 right-3 z-20 shadow-lg backdrop-blur-sm"
        >
          {category.isActive ? (
            <>
              <Eye className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>

        {/* Image Section */}
        <div className="relative w-full h-48 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
          {hasValidImage ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/30 border-t-primary" />
                    <ImageIcon className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}
              <Image
                src={category.image.url}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-all duration-500 group-hover:scale-110"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true)
                  setImageLoading(false)
                }}
                quality={90}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="p-5 bg-background/90 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 transition-transform duration-300 group-hover:scale-105">
                <FolderKanban className="w-12 h-12 text-primary/70" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground font-medium">
                No Image
              </p>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Edit buttons on hover for images */}
          {canEdit && hasValidImage && (
            <div className="absolute top-3 left-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                onClick={() => onEdit(category)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
            
            {canEdit && !hasValidImage && (
              <div className="flex gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive"
                  onClick={() => onDelete(category)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Items</p>
              </div>
              <p className="font-semibold text-xl">{formatNumber(category.metadata?.itemCount || 0)}</p>
            </div>
            <div className="flex items-center justify-center">
              <Badge 
                variant={category.isActive ? 'default' : 'secondary'}
                className="text-xs px-3 py-1"
              >
                {category.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const SkeletonCard = () => (
  <Card>
    <div className="w-full h-48 skeleton" />
    <CardContent className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-6 skeleton rounded w-2/3" />
          <div className="h-4 skeleton rounded w-full" />
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 skeleton rounded" />
          <div className="w-8 h-8 skeleton rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="h-16 skeleton rounded" />
        <div className="h-16 skeleton rounded" />
      </div>
    </CardContent>
  </Card>
)

export default function CategoriesPage() {
  const { user } = useAuthStore()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)

  const canEdit = user?.role === 'admin' || user?.role === 'staff'

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await categoriesAPI.getAll()
      setCategories(response.data.data.categories)
    } catch (error) {
      toast.error('Failed to load categories')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCategoryCreated = () => {
    setShowCreateModal(false)
    fetchCategories()
  }

  const handleCategoryUpdated = () => {
    setEditingCategory(null)
    fetchCategories()
  }

  const handleCategoryDeleted = () => {
    setDeletingCategory(null)
    fetchCategories()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize your inventory into categories
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        )}
      </motion.div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {categories.map((category) => (
            <CategoryCard
              key={category._id}
              category={category}
              onEdit={setEditingCategory}
              onDelete={setDeletingCategory}
              canEdit={canEdit}
            />
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="p-6 bg-primary/10 rounded-2xl inline-block mb-4">
                <FolderKanban className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first category
              </p>
              {canEdit && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateCategoryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCategoryCreated}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          isOpen={!!editingCategory}
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={handleCategoryUpdated}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryModal
          isOpen={!!deletingCategory}
          category={deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onSuccess={handleCategoryDeleted}
        />
      )}
    </div>
  )
}