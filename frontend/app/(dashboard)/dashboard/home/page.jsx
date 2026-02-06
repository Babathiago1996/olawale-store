'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { dashboardAPI, alertsAPI } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { toast } from 'sonner'

const StatCard = ({ title, value, subtitle, icon: Icon, trend, delay = 0, loading }) => {
  const isPositive = trend?.type === 'up'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 w-24 skeleton rounded" />
          ) : (
            <>
              <div className="text-3xl font-bold">{value}</div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  {isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs yesterday</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const RecentSaleItem = ({ sale, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between py-3 border-b last:border-0"
  >
    <div className="flex-1">
      <p className="font-medium">{sale.saleNumber}</p>
      <p className="text-sm text-muted-foreground">
        {sale.totalItems} items • {sale.soldBy?.firstName} {sale.soldBy?.lastName}
      </p>
    </div>
    <div className="text-right">
      <p className="font-semibold">{formatCurrency(sale.totalAmount)}</p>
      <p className="text-xs text-muted-foreground">{sale.paymentMethod}</p>
    </div>
  </motion.div>
)

const LowStockItem = ({ item, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center gap-3 py-3 border-b last:border-0"
  >
    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
      <Package className="h-4 w-4 text-amber-600" />
    </div>
    <div className="flex-1">
      <p className="font-medium">{item.name}</p>
      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-amber-600">{item.stockQuantity} units</p>
      <p className="text-xs text-muted-foreground">Threshold: {item.lowStockThreshold}</p>
    </div>
  </motion.div>
)

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, alertsResponse] = await Promise.all([
          dashboardAPI.getOverview(),
          alertsAPI.getCritical()
        ])

        setData(dashboardResponse.data.data)
        setAlerts(alertsResponse.data.data.alerts)
      } catch (error) {
        console.error('Dashboard fetch error:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with your store.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Inventory Value"
          value={loading ? '...' : formatCurrency(data?.inventory?.totalValue || 0)}
          subtitle={`${data?.inventory?.totalItems || 0} total items`}
          icon={Package}
          delay={0.1}
          loading={loading}
        />
        <StatCard
          title="Today's Revenue"
          value={loading ? '...' : formatCurrency(data?.sales?.today?.revenue || 0)}
          subtitle={`${data?.sales?.today?.count || 0} sales`}
          icon={ShoppingCart}
          delay={0.2}
          loading={loading}
        />
        <StatCard
          title="Today's Profit"
          value={loading ? '...' : formatCurrency(data?.sales?.today?.profit || 0)}
          subtitle="Net profit today"
          icon={TrendingUp}
          delay={0.3}
          loading={loading}
        />
        <StatCard
          title="Critical Alerts"
          value={loading ? '...' : formatNumber(data?.alerts?.critical || 0)}
          subtitle={`${data?.alerts?.unresolved || 0} unresolved`}
          icon={AlertTriangle}
          delay={0.4}
          loading={loading}
        />
      </div>

      {/* Second Row - Month Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
              <CardDescription>Monthly performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-semibold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(data?.sales?.month?.revenue || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profit</span>
                <span className="font-semibold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(data?.sales?.month?.profit || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sales</span>
                <span className="font-semibold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatNumber(data?.sales?.month?.count || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory Status</CardTitle>
              <CardDescription>Stock overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="font-semibold text-green-600">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatNumber(data?.inventory?.availableItems || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Low Stock</span>
                <span className="font-semibold text-amber-600">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatNumber(data?.inventory?.lowStockItems || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Out of Stock</span>
                <span className="font-semibold text-red-600">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatNumber(data?.inventory?.outOfStockItems || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
              <CardDescription>Other metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="font-semibold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatNumber(data?.users?.active || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="font-semibold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatNumber(data?.users?.total || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 skeleton rounded" />
                  ))}
                </div>
              ) : data?.recentSales?.length > 0 ? (
                <div>
                  {data.recentSales.map((sale, index) => (
                    <RecentSaleItem 
                      key={sale._id} 
                      sale={sale} 
                      delay={0.1 * index}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent sales
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Items needing restock</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 skeleton rounded" />
                  ))}
                </div>
              ) : alerts?.length > 0 ? (
                <div>
                  {alerts.slice(0, 5).map((alert, index) => (
                    alert.item && (
                      <LowStockItem 
                        key={alert._id} 
                        item={alert.item} 
                        delay={0.1 * index}
                      />
                    )
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No low stock alerts
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}