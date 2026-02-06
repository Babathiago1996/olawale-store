'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { itemsAPI } from '@/lib/api'
import { toast } from 'sonner'

export function EditItemModal({ isOpen, item, onClose, onSuccess, categories }) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      category: item?.category?._id || item?.category || '',
      costPrice: item?.costPrice || 0,
      sellingPrice: item?.sellingPrice || 0,
      unit: item?.unit || 'piece',
      lowStockThreshold: item?.lowStockThreshold || 10,
      barcode: item?.barcode || '',
    }
  })

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        description: item.description,
        category: item.category?._id || item.category,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        unit: item.unit,
        lowStockThreshold: item.lowStockThreshold,
        barcode: item.barcode || '',
      })
    }
  }, [item, reset])

  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      await itemsAPI.update(item._id, data)
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g., Premium Rice 50kg"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                {...register('category', { required: 'Category is required' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Item description..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Pricing */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (₦) *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                {...register('costPrice', { 
                  required: 'Cost price is required',
                  min: { value: 0, message: 'Must be positive' }
                })}
                placeholder="0.00"
              />
              {errors.costPrice && (
                <p className="text-sm text-destructive">{errors.costPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price (₦) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                {...register('sellingPrice', { 
                  required: 'Selling price is required',
                  min: { value: 0, message: 'Must be positive' }
                })}
                placeholder="0.00"
              />
              {errors.sellingPrice && (
                <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                {...register('unit')}
                placeholder="e.g., piece, kg, box"
              />
            </div>
          </div>

          {/* Stock Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                {...register('lowStockThreshold')}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode (Optional)</Label>
              <Input
                id="barcode"
                {...register('barcode')}
                placeholder="Barcode number"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Item'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}