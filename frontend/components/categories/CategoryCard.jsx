'use client'

import { motion } from 'framer-motion'
import {
  FolderKanban,
  Edit,
  Trash2,
  Layers,
  Calendar,
  User,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPrice } from '@/lib/utils'
import { useState } from 'react'

export function CategoryCard({ category, onEdit, onDelete, canEdit }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const {
    name,
    slug,
    description,
    image,
    parentCategory,
    metadata,
    isActive,
    order,
    createdBy,
    createdAt,
  } = category

  const hasValidImage = image && image.url && !imageError

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden h-full group relative">
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className="absolute top-3 right-3 z-10 shadow-lg"
        >
          {isActive ? (
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

        <div className="relative w-full h-48 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
          {hasValidImage ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}
              <Image
                src={image.url}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true)
                  setImageLoading(false)
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-6 bg-primary/10 rounded-2xl">
                <FolderKanban className="w-12 h-12 text-primary" />
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight truncate">
                {name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                /{slug}
              </p>
            </div>

            {canEdit && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {parentCategory && (
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Parent Category</p>
                <p className="text-sm font-medium truncate">
                  {parentCategory.name}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Items</p>
              </div>
              <p className="font-semibold text-xl">
                {formatNumber(metadata?.itemCount || 0)}
              </p>
            </div>

            <div className="p-3 bg-green-500/5 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <p className="text-xs text-muted-foreground">Value</p>
              </div>
              <p className="font-semibold text-xl text-green-700 dark:text-green-400">
                {formatPrice(metadata?.totalValue || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>

            {createdBy && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">
                  {createdBy.firstName} {createdBy.lastName}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Badge variant="outline" className="text-[10px]">
              Order: {order}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}