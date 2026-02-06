'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { alertsAPI } from '@/lib/api'
import { getAlertSeverityColor, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'

const AlertCard = ({ alert, onMarkAsRead, onResolve, loading }) => {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <AlertTriangle className="w-5 h-5" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={!alert.isRead ? 'border-l-4 border-l-primary' : ''}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className={`p-2 rounded-lg h-fit ${getAlertSeverityColor(alert.severity)}`}>
              {getSeverityIcon(alert.severity)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                </div>
                {!alert.isRead && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground flex-shrink-0">
                    New
                  </span>
                )}
              </div>

              {alert.item && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-muted rounded-lg">
                  <div className="w-12 h-12 relative rounded overflow-hidden bg-background flex-shrink-0">
                    {alert.item.primaryImage?.url ? (
                      <Image
                        src={alert.item.primaryImage.url}
                        alt={alert.item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{alert.item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {alert.item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{alert.item.stockQuantity} {alert.item.unit}</p>
                    <p className="text-xs text-muted-foreground">
                      Threshold: {alert.item.lowStockThreshold}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  {formatDate(alert.createdAt, 'PPp')}
                </p>
                <div className="flex gap-2">
                  {!alert.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkAsRead(alert._id)}
                      disabled={loading === alert._id}
                    >
                      {loading === alert._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Mark as Read'
                      )}
                    </Button>
                  )}
                  {!alert.isResolved && (
                    <Button
                      size="sm"
                      onClick={() => onResolve(alert._id)}
                      disabled={loading === alert._id}
                    >
                      {loading === alert._id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolve
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [filter, setFilter] = useState('all') // all, unread, critical

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      let response
      if (filter === 'unread') {
        response = await alertsAPI.getUnread()
      } else if (filter === 'critical') {
        response = await alertsAPI.getCritical()
      } else {
        response = await alertsAPI.getUnresolved()
      }
      
      const statsResponse = await alertsAPI.getStatistics()
      
      setAlerts(response.data.data.alerts || response.data.data)
      setStats(statsResponse.data.data)
    } catch (error) {
      toast.error('Failed to load alerts')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    setActionLoading(id)
    try {
      await alertsAPI.markAsRead(id)
      toast.success('Alert marked as read')
      fetchAlerts()
    } catch (error) {
      toast.error('Failed to mark alert as read')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolve = async (id) => {
    setActionLoading(id)
    try {
      await alertsAPI.resolve(id)
      toast.success('Alert resolved')
      fetchAlerts()
    } catch (error) {
      toast.error('Failed to resolve alert')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await alertsAPI.markAllAsRead()
      toast.success('All alerts marked as read')
      fetchAlerts()
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
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
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage system alerts
          </p>
        </div>
        {alerts.some(a => !a.isRead) && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Alerts</p>
            <p className="text-2xl font-bold mt-2">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.total || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Unread</p>
            <p className="text-2xl font-bold mt-2">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.unread || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Unresolved</p>
            <p className="text-2xl font-bold mt-2">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.unresolved || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Critical</p>
            <p className="text-2xl font-bold mt-2 text-red-600">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.bySeverity?.critical || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'critical' ? 'default' : 'outline'}
              onClick={() => setFilter('critical')}
            >
              Critical
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 skeleton rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 skeleton rounded w-1/3" />
                    <div className="h-4 skeleton rounded w-2/3" />
                    <div className="h-16 skeleton rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert._id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
              onResolve={handleResolve}
              loading={actionLoading}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'No alerts at this time'
                  : filter === 'unread'
                  ? 'No unread alerts'
                  : 'No critical alerts'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}