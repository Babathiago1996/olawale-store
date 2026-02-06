'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Package,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { itemsAPI, categoriesAPI } from '@/lib/api'
import { formatCurrency, getStockStatusColor, debounce } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import { CreateItemModal } from '@/components/inventory/create-item-modal'
import { EditItemModal } from '@/components/inventory/edit-item-modal'
import { DeleteItemModal } from '@/components/inventory/delete-item-modal'
import { RestockModal } from '@/components/items/restock-modal'
import { useAuthStore } from '@/lib/store'

const StockBadge = ({ status }) => {
  const statusLabels = {
    available: 'Available',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(status)}`}>
      {statusLabels[status]}
    </span>
  )
}

const ItemCard = ({ item, onEdit, onDelete, onRestock, canEdit }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="overflow-hidden h-full">
      <div className="aspect-square relative bg-gray-100 dark:bg-gray-800">
        {item.primaryImage?.url ? (
          <Image
            src={item.primaryImage.url}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StockBadge status={item.stockStatus} />
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">SKU: {item.sku}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stock:</span>
            <span className="font-medium">{item.stockQuantity} {item.unit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cost:</span>
            <span className="font-medium">{formatCurrency(item.costPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Selling:</span>
            <span className="font-medium">{formatCurrency(item.sellingPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Profit:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(item.profitPerUnit)}
            </span>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onRestock(item)}
            >
              Restock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
)

const SkeletonCard = () => (
  <Card>
    <div className="aspect-square skeleton" />
    <CardContent className="p-4 space-y-3">
      <div className="h-6 skeleton rounded w-3/4" />
      <div className="h-4 skeleton rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-4 skeleton rounded" />
        <div className="h-4 skeleton rounded" />
        <div className="h-4 skeleton rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 skeleton rounded flex-1" />
        <div className="h-9 w-9 skeleton rounded" />
        <div className="h-9 w-9 skeleton rounded" />
      </div>
    </CardContent>
  </Card>
)

export default function InventoryPage() {
  const { user } = useAuthStore()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStock, setSelectedStock] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [restockingItem, setRestockingItem] = useState(null)

  const canEdit = user?.role === 'admin' || user?.role === 'staff'

  const fetchItems = async (params = {}) => {
    setLoading(true)
    try {
      const response = await itemsAPI.getAll({
        page,
        limit: 12,
        search: searchQuery,
        category: selectedCategory,
        stockStatus: selectedStock,
        ...params
      })
      setItems(response.data.data.items)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      toast.error('Failed to load items')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll({ isActive: true })
      setCategories(response.data.data.categories)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  useEffect(() => {
    fetchItems()
    fetchCategories()
  }, [page])

  const handleSearch = debounce((value) => {
    setSearchQuery(value)
    setPage(1)
    fetchItems({ search: value })
  }, 500)

  const handleFilter = () => {
    setPage(1)
    fetchItems()
  }

  const handleItemCreated = () => {
    setShowCreateModal(false)
    fetchItems()
    toast.success('Item created successfully')
  }

  const handleItemUpdated = () => {
    setEditingItem(null)
    fetchItems()
    toast.success('Item updated successfully')
  }

  const handleItemDeleted = () => {
    setDeletingItem(null)
    fetchItems()
    toast.success('Item deleted successfully')
  }

  const handleItemRestocked = () => {
    setRestockingItem(null)
    fetchItems()
    toast.success('Item restocked successfully')
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
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products and stock levels
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>

              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
              >
                <option value="">All Stock Status</option>
                <option value="available">Available</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>

              <Button onClick={handleFilter} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {items.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
              onRestock={setRestockingItem}
              canEdit={canEdit}
            />
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory || selectedStock
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first item'}
              </p>
              {canEdit && !searchQuery && !selectedCategory && !selectedStock && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateItemModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleItemCreated}
          categories={categories}
        />
      )}

      {editingItem && (
        <EditItemModal
          isOpen={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={handleItemUpdated}
          categories={categories}
        />
      )}

      {deletingItem && (
        <DeleteItemModal
          isOpen={!!deletingItem}
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onSuccess={handleItemDeleted}
        />
      )}

      {restockingItem && (
        <RestockModal
          isOpen={!!restockingItem}
          item={restockingItem}
          onClose={() => setRestockingItem(null)}
          onSuccess={handleItemRestocked}
        />
      )}
    </div>
  )
}