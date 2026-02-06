"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { dashboardAPI, salesAPI, itemsAPI, alertsAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { toast } from "sonner";

const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  trend,
  loading,
  subtitle,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : trend === "down" ? (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                ) : null}
                <span
                  className={`text-xs font-medium ${
                    trend === "up"
                      ? "text-green-600"
                      : trend === "down"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
                <span className="text-xs text-muted-foreground">
                  vs yesterday
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const RecentSaleItem = ({ sale }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{sale.saleNumber}</p>
      <p className="text-xs text-muted-foreground">
        {new Date(sale.saleDate).toLocaleDateString()} • {sale.totalItems} items
      </p>
    </div>
    <div className="text-right ml-4">
      <p className="text-sm font-semibold text-primary">
        {formatCurrency(sale.totalAmount)}
      </p>
      <Badge variant="outline" className="text-xs">
        {sale.paymentMethod}
      </Badge>
    </div>
  </div>
);

const LowStockItem = ({ item }) => (
  <div className="flex items-center gap-3 py-3 border-b last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{item.name}</p>
      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
    </div>
    <div className="text-right">
      <Badge variant="destructive" className="text-xs">
        {item.stockQuantity} {item.unit}
      </Badge>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    inventory: {},
    sales: {},
    alerts: {},
    recentSales: [],
    lowStockItems: [],
  });

  const fetchDashboardData = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await dashboardAPI.getOverview();
      setDashboardData(response.data.data);

      if (showRefreshToast) {
        toast.success("Dashboard refreshed");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              {getGreeting()}, {user?.firstName || "User"}! 👋
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Here's what's happening with your store today
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Link href="/dashboard/sales">
              <Button className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                New Sale
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(dashboardData.sales?.today?.revenue || 0)}
            change={dashboardData.sales?.today?.growth}
            trend={dashboardData.sales?.today?.growth > 0 ? "up" : "down"}
            icon={DollarSign}
            loading={loading}
            subtitle={`${dashboardData.sales?.today?.count || 0} sales`}
          />
          <StatCard
            title="Today's Profit"
            value={formatCurrency(dashboardData.sales?.today?.profit || 0)}
            icon={TrendingUp}
            loading={loading}
          />
          <StatCard
            title="Total Inventory"
            value={dashboardData.inventory?.totalItems || 0}
            subtitle={`${dashboardData.inventory?.availableItems || 0} available`}
            icon={Package}
            loading={loading}
          />
          <StatCard
            title="Low Stock Items"
            value={dashboardData.inventory?.lowStockItems || 0}
            subtitle={`${dashboardData.inventory?.outOfStockItems || 0} out of stock`}
            icon={AlertTriangle}
            loading={loading}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.sales?.month?.revenue || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dashboardData.sales?.month?.count || 0} total sales
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    {formatCurrency(dashboardData.sales?.month?.profit || 0)}{" "}
                    profit
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Inventory Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.inventory?.totalValue || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total stock value at cost
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {dashboardData.alerts?.unresolved || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {dashboardData.alerts?.critical || 0} Critical
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Sales</CardTitle>
                <Link href="/dashboard/sales/history">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between py-3 border-b">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : dashboardData.recentSales?.length > 0 ? (
                <div className="space-y-1">
                  {dashboardData.recentSales.slice(0, 5).map((sale) => (
                    <RecentSaleItem key={sale._id} sale={sale} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No recent sales</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Low Stock Alert</CardTitle>
                <Link href="/dashboard/inventory">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Items that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between py-3 border-b">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : dashboardData.lowStockItems?.length > 0 ? (
                <div className="space-y-1">
                  {dashboardData.lowStockItems.slice(0, 5).map((item) => (
                    <LowStockItem key={item._id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">All items well stocked</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/dashboard/sales" className="block">
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-xs">New Sale</span>
                </Button>
              </Link>
              <Link href="/dashboard/inventory" className="block">
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2"
                >
                  <Package className="w-5 h-5" />
                  <span className="text-xs">Add Item</span>
                </Button>
              </Link>
              <Link href="/dashboard/sales" className="block">
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-xs">Reports</span>
                </Button>
              </Link>
              <Link href="/dashboard/alerts" className="block">
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-xs">Alerts</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
