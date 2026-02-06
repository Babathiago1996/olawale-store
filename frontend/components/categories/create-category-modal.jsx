'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { X, Upload, Loader2, Image as ImageIcon, FolderKanban, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { categoriesAPI } from '@/lib/api'
import { toast } from 'sonner'
import Image from 'next/image'

export function CreateCategoryModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      parentCategory: 'none',
      order: 0,
      isActive: true
    }
  })

  // Fetch existing categories for parent selection
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll()
      setCategories(response.data.data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Image size must be less than 3MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file')
        return
      }

      setImageFile(file)
      const preview = URL.createObjectURL(file)
      setImagePreview(preview)
    }
  }

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const onSubmit = async (data) => {
    setLoading(true)

    try {
      const formData = new FormData()
      
      // Add all form fields
      formData.append('name', data.name.trim())
      
      if (data.description?.trim()) {
        formData.append('description', data.description.trim())
      }
      
      // Only add parentCategory if it's not empty or 'none'
      if (data.parentCategory && data.parentCategory !== 'none') {
        formData.append('parentCategory', data.parentCategory)
      }
      
      formData.append('order', data.order)
      formData.append('isActive', data.isActive)

      // Add image if selected
      if (imageFile) {
        formData.append('image', imageFile)
      }

      await categoriesAPI.create(formData)

      toast.success('Category created successfully')
      
      // Reset form and close
      reset()
      setImagePreview(null)
      setImageFile(null)
      onSuccess()
      onClose()
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create category'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      reset()
      setImagePreview(null)
      setImageFile(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-background w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Create New Category</h2>
              <p className="text-sm text-muted-foreground">Add a new category to organize your inventory</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {/* Category Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Electronics, Furniture, Office Supplies"
              {...register('name', {
                required: 'Category name is required',
                maxLength: {
                  value: 100,
                  message: 'Name cannot exceed 100 characters'
                },
                validate: {
                  noLeadingTrailingSpace: (value) =>
                    value.trim() === value || 'Remove leading/trailing spaces',
                  notEmpty: (value) =>
                    value.trim().length > 0 || 'Name cannot be empty'
                }
              })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.name.message}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              A unique, descriptive name for your category
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Provide additional details about this category..."
              {...register('description', {
                maxLength: {
                  value: 500,
                  message: 'Description cannot exceed 500 characters'
                }
              })}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.description.message}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {watch('description')?.length || 0}/500 characters
            </p>
          </div>

          {/* Parent Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
            <Controller
              name="parentCategory"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                  value={field.value || 'none'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top-level category)</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Create a subcategory by selecting a parent
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Category Image (Optional)</Label>

            <div className="border-2 border-dashed rounded-lg overflow-hidden">
              {imagePreview ? (
                <div className="relative">
                  <div className="relative h-48 w-full">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain bg-muted"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-muted/50 transition group">
                  <Upload className="w-10 h-10 text-muted-foreground mb-3 group-hover:text-primary transition" />
                  <p className="text-sm font-medium mb-1">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 3MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x1200px for best quality
            </p>
          </div>

          {/* Grid: Order + Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min="0"
                {...register('order', {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: 'Order must be 0 or greater'
                  }
                })}
                className={errors.order ? 'border-destructive' : ''}
              />
              {errors.order && (
                <p className="text-xs text-destructive">{errors.order.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>

            {/* Active Status */}
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <div className="flex items-center justify-between h-10 px-4 border rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {watch('isActive') ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {watch('isActive') ? 'Visible to users' : 'Hidden from users'}
                  </span>
                </div>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderKanban className="w-4 h-4 mr-2" />
                  Create Category
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}