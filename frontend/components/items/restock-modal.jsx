'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Loader2, Package, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { itemsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export function RestockModal({ isOpen, item, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  const { 
    register, 
    handleSubmit, 
    watch, 
    reset,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      quantity: '',
      costPrice: item?.costPrice || 0,
      supplier: '',
      reference: '',
      notes: ''
    }
  })

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        quantity: '',
        costPrice: item.costPrice || 0,
        supplier: '',
        reference: '',
        notes: ''
      })
    }
  }, [item, reset])

  const quantity = watch('quantity')
  const costPrice = watch('costPrice')
  const newStock = (item?.stockQuantity || 0) + (parseInt(quantity) || 0)
  const totalCost = (parseInt(quantity) || 0) * (parseFloat(costPrice) || 0)

 const onSubmit = async (data) => {
  setLoading(true);
  
  try {
    await itemsAPI.restock(item._id, {
      quantity: parseInt(data.quantity),
      costPrice: parseFloat(data.costPrice),
      supplier: data.supplier || undefined,
      reference: data.reference || undefined,
      notes: data.notes || undefined
    })
    
    toast.success('Item restocked successfully! 📦')
    reset()
    
    // ✅ CRITICAL: Call onSuccess BEFORE closing to ensure parent refreshes
    if (onSuccess) {
      await onSuccess() // Make sure this is awaited
    }
    
    onClose()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to restock item')
  } finally {
    setLoading(false)
  }
}

  const handleClose = () => {
    if (!loading) {
      reset()
      onClose()
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Restock Item</h2>
              <p className="text-sm text-muted-foreground">Add inventory to existing stock</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body - Scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Item Info - Fixed at top of scroll */}
            <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="font-semibold">{item.stockQuantity} {item.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Cost</p>
                  <p className="font-semibold">{formatCurrency(item.costPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Selling Price</p>
                  <p className="font-semibold text-primary">{formatCurrency(item.sellingPrice)}</p>
                </div>
              </div>
            </div>

            {/* Restock Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity to Add <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  {...register('quantity', { 
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Must be at least 1' },
                    valueAsNumber: true
                  })}
                  placeholder="Enter quantity"
                />
                {errors.quantity && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.quantity.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">
                  Cost Price (₦) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  {...register('costPrice', { 
                    required: 'Cost price is required',
                    min: { value: 0, message: 'Must be positive' },
                    valueAsNumber: true
                  })}
                  placeholder="0.00"
                />
                {errors.costPrice && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.costPrice.message}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Input
                id="supplier"
                {...register('supplier')}
                placeholder="e.g., ABC Suppliers Ltd"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Invoice/Reference Number (Optional)</Label>
              <Input
                id="reference"
                {...register('reference')}
                placeholder="e.g., INV-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Add any additional notes about this restock..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {watch('notes')?.length || 0}/500
              </p>
            </div>

            {/* Summary - Shows when values entered */}
            {quantity > 0 && costPrice > 0 && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Restock Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Adding to Stock</p>
                    <p className="font-semibold text-lg">+{quantity} {item.unit}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">New Total Stock</p>
                    <p className="font-semibold text-lg text-primary">{newStock} {item.unit}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Investment</p>
                    <p className="font-semibold">{formatCurrency(totalCost)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cost per Unit</p>
                    <p className="font-semibold">{formatCurrency(parseFloat(costPrice))}</p>
                  </div>
                </div>
                
                {/* Profit Margin Indicator */}
                {costPrice > 0 && item.sellingPrice > 0 && (
                  <div className="pt-3 border-t border-primary/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Expected Profit Margin:</span>
                      <span className={`font-semibold ${
                        ((item.sellingPrice - costPrice) / costPrice * 100) > 30 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {((item.sellingPrice - costPrice) / costPrice * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex gap-3 p-6 border-t bg-muted/30 flex-shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restocking...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Restock Item
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}