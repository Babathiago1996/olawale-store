"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Eye,
  Loader2,
  X,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salesAPI } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const SaleCard = ({ sale, onClick }) => {
  const statusColors = {
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    refunded:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  };

  const paymentColors = {
    paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    partial:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    refunded: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onClick(sale)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1">{sale.saleNumber}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(sale.saleDate, "PPp")}
              </p>
              {sale.customer?.name && (
                <p className="text-sm font-medium mt-1 truncate">
                  👤 {sale.customer.name}
                  {sale.customer.phone && (
                    <span className="text-muted-foreground">
                      {" "}
                      • {sale.customer.phone}
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge
                className={statusColors[sale.status] || statusColors.completed}
              >
                {sale.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
              <p className="font-bold text-lg">
                {formatCurrency(sale.totalAmount)}
              </p>
            </div>
            <div className="bg-green-500/5 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Profit</p>
              <p className="font-bold text-lg text-green-600 dark:text-green-400">
                {formatCurrency(sale.totalProfit)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <span>{sale.totalItems} items</span>
            </div>
            <Badge
              variant="outline"
              className={paymentColors[sale.paymentStatus]}
            >
              {sale.paymentMethod}
            </Badge>
          </div>

          {sale.discount?.amount > 0 && (
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              💰 Discount applied: {formatCurrency(sale.discount.amount)}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatsCard = ({ icon: Icon, label, value, trend, loading }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <Badge
            variant="outline"
            className="text-green-600 dark:text-green-400"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-24 skeleton rounded" />
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </CardContent>
  </Card>
);

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  // Filters
  const [period, setPeriod] = useState("today");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesResponse, statsResponse] = await Promise.all([
        salesAPI.getAll({
          page: 1,
          limit: 100,
          status: "completed",
          paymentStatus: paymentStatus || undefined,
          ...(paymentMethod && { paymentMethod }),
        }),
        salesAPI.getStatistics({ period }),
      ]);

      setSales(salesResponse.data.data.sales);
      setStats(statsResponse.data.data);
    } catch (error) {
      toast.error("Failed to load sales data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, paymentStatus, paymentMethod]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/dashboard/sales">
          <Button variant="ghost" size="sm" className="mb-3">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Sales
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales History</h1>
            <p className="text-muted-foreground mt-1">
              View and analyze all transactions
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Time Period</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPeriod("today");
                  setPaymentStatus("");
                  setPaymentMethod("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={ShoppingCart}
          label="Total Sales"
          value={loading ? "..." : stats?.totalSales || 0}
          loading={loading}
        />
        <StatsCard
          icon={DollarSign}
          label="Revenue"
          value={loading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
          loading={loading}
        />
        <StatsCard
          icon={TrendingUp}
          label="Profit"
          value={loading ? "..." : formatCurrency(stats?.totalProfit || 0)}
          loading={loading}
        />
        <StatsCard
          icon={Calendar}
          label="Avg Sale Value"
          value={loading ? "..." : formatCurrency(stats?.averageSaleValue || 0)}
          loading={loading}
        />
      </div>

      {/* Sales List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="h-6 skeleton rounded" />
                  <div className="h-4 skeleton rounded w-2/3" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 skeleton rounded" />
                    <div className="h-16 skeleton rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sales.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sales.map((sale) => (
              <SaleCard key={sale._id} sale={sale} onClick={setSelectedSale} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">No sales found</h3>
                <p className="text-muted-foreground text-sm">
                  {paymentStatus || paymentMethod
                    ? "Try adjusting your filters"
                    : "No sales for this period"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sale Details Modal - Simple for now */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Sale Details</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSale(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sale Number</p>
                  <p className="font-semibold">{selectedSale.saleNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {formatDate(selectedSale.saleDate, "PPp")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(selectedSale.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Profit</p>
                  <p className="font-semibold text-lg text-green-600">
                    {formatCurrency(selectedSale.totalProfit)}
                  </p>
                </div>
              </div>

              {selectedSale.customer?.name && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Customer</h4>
                  <p>{selectedSale.customer.name}</p>
                  {selectedSale.customer.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedSale.customer.phone}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">
                  Items ({selectedSale.totalItems})
                </h4>
                <div className="space-y-2">
                  {selectedSale.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {item.itemName} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
