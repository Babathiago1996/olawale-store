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
  EyeOff,
  ImageIcon
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
      <Card className="overflow-hidden h-full group relative shadow-sm hover:shadow-xl transition-shadow duration-300">
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className="absolute top-3 right-3 z-20 shadow-lg backdrop-blur-sm"
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

        {/* Image Section - Fixed and Improved */}
        <div className="relative w-full h-56 sm:h-52 md:h-48 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
          {hasValidImage ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary" />
                    <ImageIcon className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}
              <Image
                src={image.url}
                alt={name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-90"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true)
                  setImageLoading(false)
                }}
                priority={false}
                quality={90}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="p-6 bg-background/90 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 transition-transform duration-300 group-hover:scale-105">
                <FolderKanban className="w-16 h-16 text-primary/70" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground font-medium px-4 text-center">
                No Image Available
              </p>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Edit/Delete buttons on hover (only show on image hover) */}
          {canEdit && hasValidImage && (
            <div className="absolute top-3 left-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg"
                onClick={() => onEdit(category)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 bg-background/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground shadow-lg"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight truncate mb-1">
                {name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                /{slug}
              </p>
            </div>

            {/* Edit/Delete buttons (always visible if no image) */}
            {canEdit && !hasValidImage && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10"
                  onClick={() => onEdit(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
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
              <Layers className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Parent Category</p>
                <p className="text-sm font-medium truncate">
                  {parentCategory.name}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="p-3 bg-primary/5 rounded-lg transition-colors hover:bg-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Items</p>
              </div>
              <p className="font-bold text-xl">
                {formatNumber(metadata?.itemCount || 0)}
              </p>
            </div>

            <div className="p-3 bg-emerald-500/5 rounded-lg transition-colors hover:bg-emerald-500/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground">Value</p>
              </div>
              <p className="font-bold text-xl text-emerald-700 dark:text-emerald-400 truncate">
                {formatPrice(metadata?.totalValue || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
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
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate max-w-[100px]">
                  {createdBy.firstName} {createdBy.lastName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Badge variant="outline" className="text-[10px] font-mono">
              Order: {order}
            </Badge>
            
            {hasValidImage && (
              <Badge variant="secondary" className="text-[10px]">
                <ImageIcon className="w-3 h-3 mr-1" />
                Image
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}