'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, FolderKanban, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { categoriesAPI } from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import { CreateCategoryModal } from '@/components/categories/create-category-modal'
import { EditCategoryModal } from '@/components/categories/edit-category-modal'
import { DeleteCategoryModal } from '@/components/categories/delete-category-modal'

const CategoryCard = ({ category, onEdit, onDelete, canEdit }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="overflow-hidden h-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FolderKanban className="w-6 h-6 text-primary" />
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(category)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
        {category.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {category.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="font-semibold text-lg">{formatNumber(category.metadata?.itemCount || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="font-semibold text-lg">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                category.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
                {category.isActive ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const SkeletonCard = () => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 skeleton rounded-lg" />
        <div className="flex gap-2">
          <div className="w-8 h-8 skeleton rounded" />
          <div className="w-8 h-8 skeleton rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-6 skeleton rounded w-1/2" />
        <div className="h-4 skeleton rounded w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 skeleton rounded" />
        <div className="h-12 skeleton rounded" />
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
    toast.success('Category created successfully')
  }

  const handleCategoryUpdated = () => {
    setEditingCategory(null)
    fetchCategories()
    toast.success('Category updated successfully')
  }

  const handleCategoryDeleted = () => {
    setDeletingCategory(null)
    fetchCategories()
    toast.success('Category deleted successfully')
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
              <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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