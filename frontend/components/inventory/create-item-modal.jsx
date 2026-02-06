'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { X, Upload, Camera, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { itemsAPI } from '@/lib/api'
import { toast } from 'sonner'
import Image from 'next/image'

export function CreateItemModal({ isOpen, onClose, onSuccess, categories }) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    setImages(prev => [...prev, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      const formData = new FormData()
      
      // Append text fields
      Object.keys(data).forEach(key => {
        if (data[key] !== '') {
          formData.append(key, data[key])
        }
      })
      
      // Append images
      images.forEach(image => {
        formData.append('images', image)
      })

      await itemsAPI.create(formData)
      onSuccess()
      reset()
      setImages([])
      setPreviewUrls([])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Images */}
          <div className="space-y-3">
            <Label>Images (Max 5)</Label>
            <div className="grid grid-cols-5 gap-3">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Camera</span>
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

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
                defaultValue="piece"
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
              <Input
                id="stockQuantity"
                type="number"
                {...register('stockQuantity', { 
                  required: 'Stock quantity is required',
                  min: { value: 0, message: 'Must be positive' }
                })}
                placeholder="0"
              />
              {errors.stockQuantity && (
                <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                {...register('lowStockThreshold')}
                placeholder="10"
                defaultValue="10"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode (Optional)</Label>
            <Input
              id="barcode"
              {...register('barcode')}
              placeholder="Barcode number"
            />
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
                  Creating...
                </>
              ) : (
                'Create Item'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}