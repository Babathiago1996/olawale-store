'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import Image from 'next/image'

export function CategoryForm({
  initialData,
  categories,
  onSubmit,
  loading,
  submitLabel
}) {
  const [preview, setPreview] = useState(initialData?.image?.url || null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      parentCategory: initialData?.parentCategory?._id || '',
      order: initialData?.order ?? 0,
      isActive: initialData?.isActive ?? true
    }
  })

  const imageFile = watch('image')

  useEffect(() => {
    if (imageFile && imageFile[0]) {
      const file = imageFile[0]
      setPreview(URL.createObjectURL(file))
    }
  }, [imageFile])

  const submitHandler = (data) => {
    const formData = new FormData()

    formData.append('name', data.name)
    if (data.description) formData.append('description', data.description)
    if (data.parentCategory) formData.append('parentCategory', data.parentCategory)
    formData.append('order', data.order)
    formData.append('isActive', data.isActive)

    if (data.image?.[0]) {
      formData.append('image', data.image[0])
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label>Category Name *</Label>
        <Input {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Parent */}
      <div className="space-y-2">
        <Label>Parent Category</Label>
        <select
          {...register('parentCategory')}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">None (Top level)</option>
          {categories
            ?.filter(c => c._id !== initialData?._id)
            .map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
        </select>
      </div>

      {/* Order */}
      <div className="space-y-2">
        <Label>Display Order</Label>
        <Input type="number" {...register('order')} />
      </div>

      {/* Active */}
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch
          checked={watch('isActive')}
          onCheckedChange={v => setValue('isActive', v)}
        />
      </div>

      {/* Image */}
      <div className="space-y-2">
        <Label>Category Image</Label>

        {preview ? (
          <div className="relative w-full h-40 rounded-lg overflow-hidden border">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 border rounded-lg text-muted-foreground">
            <ImageIcon className="w-8 h-8 mr-2" />
            No image
          </div>
        )}

        <Input type="file" accept="image/*" {...register('image')} />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
