import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(number) {
  return new Intl.NumberFormat('en-NG').format(number)
}

export function formatDate(date, format = 'PP') {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  if (format === 'PPp') {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return new Intl.DateTimeFormat('en-NG', options).format(d)
}

export function getStockStatusColor(status) {
  const colors = {
    available: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
    low_stock: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
    out_of_stock: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
  }
  return colors[status] || colors.available
}

export function getAlertSeverityColor(severity) {
  const colors = {
    info: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
    critical: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
  }
  return colors[severity] || colors.info
}

export function getInitials(firstName, lastName) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function generateSKU(prefix = 'ITEM') {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}