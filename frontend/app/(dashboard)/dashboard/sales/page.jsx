"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  X,
  Search,
  ShoppingCart,
  Receipt,
  Loader2,
  History,
  Percent,
  DollarSign,
  User,
  CreditCard,
  Trash2,
  Package,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { itemsAPI, salesAPI } from "@/lib/api";
import { formatCurrency, debounce } from "@/lib/utils";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";

const ItemCard = ({ item, onAddToCart }) => {
  const stockQuantity = Number(item.stockQuantity) || 0;
  const lowStockThreshold = Number(item.lowStockThreshold) || 10;

  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= lowStockThreshold;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={`overflow-hidden h-full flex flex-col transition-all duration-200 ${
          isOutOfStock
            ? "opacity-60"
            : "hover:shadow-lg hover:border-primary/20"
        }`}
      >
        <div className="relative w-full aspect-square bg-gradient-to-br from-muted/30 to-muted/50">
          {item.primaryImage?.url ? (
            <Image
              src={item.primaryImage.url}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="w-12 h-12 md:w-14 md:h-14 text-muted-foreground/20" />
            </div>
          )}

          <div className="absolute top-2 right-2">
            {isOutOfStock ? (
              <Badge
                variant="destructive"
                className="shadow-sm text-[10px] sm:text-xs px-2 py-0.5 font-medium"
              >
                Out of Stock
              </Badge>
            ) : isLowStock ? (
              <Badge
                variant="outline"
                className="bg-amber-500/90 text-white border-amber-600 shadow-sm text-[10px] sm:text-xs px-2 py-0.5 font-medium"
              >
                Low Stock
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-background/80 backdrop-blur-sm shadow-sm text-[10px] sm:text-xs px-2 py-0.5 font-medium"
              >
                {stockQuantity} {item.unit}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          <div className="flex-1 mb-3">
            <h4 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 mb-1.5">
              {item.name}
            </h4>
            {item.sku && (
              <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">
                SKU:
                <span className="sm:hidden">
                  {(() => {
                    const parts = item.sku.split("-");
                    const category = parts[0] || "";
                    const rest = parts.slice(1).join("-");

                    const shortened =
                      category.length > 7 ? category.slice(0, 4) : category;

                    return rest ? `${shortened}-${rest}` : shortened;
                  })()}
                </span>
                <span className="hidden sm:inline">{item.sku}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-3 pt-3 border-t">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Price
              </span>
              <span className="text-base sm:text-lg lg:text-xl font-bold text-primary truncate">
                {formatCurrency(item.sellingPrice)}
              </span>
            </div>

            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(item);
              }}
              disabled={isOutOfStock}
              className="px-3 sm:px-4 h-8 sm:h-9 lg:h-10 text-xs sm:text-sm font-medium shrink-0 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:mr-1.5 lg:inline hidden " />
              <span className="inline">Add</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CartItem = ({ item, onUpdateQuantity, onRemove }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="flex gap-3 sm:gap-4 py-3 sm:py-4 border-b last:border-0"
  >
    <div className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-md sm:rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted flex-shrink-0 ring-1 ring-border/50">
      {item.primaryImage?.url ? (
        <Image
          src={item.primaryImage.url}
          alt={item.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Package className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground/30" />
        </div>
      )}
    </div>

    <div className="flex-1 min-w-0 flex flex-col">
      <h4 className="font-semibold text-sm sm:text-base truncate mb-1">
        {item.name}
      </h4>
      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
        {formatCurrency(item.sellingPrice)} × {item.quantity}
      </p>

      <div className="flex items-center gap-1.5 sm:gap-2 mt-auto">
        <Button
          size="icon"
          variant="outline"
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-md"
          onClick={() =>
            onUpdateQuantity(item._id, Math.max(1, item.quantity - 1))
          }
        >
          <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </Button>
        <span className="text-xs sm:text-sm font-semibold min-w-[2rem] sm:min-w-[2.5rem] text-center bg-muted/50 rounded-md px-2 py-1 sm:py-1.5">
          {item.quantity}
        </span>
        <Button
          size="icon"
          variant="outline"
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-md"
          onClick={() =>
            onUpdateQuantity(
              item._id,
              Math.min(item.stockQuantity, item.quantity + 1),
            )
          }
          disabled={item.quantity >= item.stockQuantity}
        >
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 sm:h-8 sm:w-8 ml-auto hover:text-destructive hover:bg-destructive/10 rounded-md"
          onClick={() => onRemove(item._id)}
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>

    <div className="text-right flex flex-col justify-between">
      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Total
      </p>
      <p className="font-bold text-base sm:text-lg text-primary">
        {formatCurrency(item.sellingPrice * item.quantity)}
      </p>
    </div>
  </motion.div>
);

export default function SalesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxType, setTaxType] = useState("percentage");
  const [taxValue, setTaxValue] = useState(0);

  const {
    items: cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
  } = useCartStore();

  const fetchItems = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const response = await itemsAPI.getAll({
        page: 1,
        limit: 100,
        search,
        isActive: true,
      });

      const freshItems = response.data.data.items.map((item) => ({
        ...item,
        stockQuantity: Number(item.stockQuantity) || 0,
        lowStockThreshold: Number(item.lowStockThreshold) || 10,
      }));

      setItems(freshItems);

      console.log(`✅ Loaded ${freshItems.length} items for sales page`);
    } catch (error) {
      toast.error("Failed to load items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Debounced search
  const debouncedSearchRef = useRef();

  useEffect(() => {
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }

    debouncedSearchRef.current = setTimeout(() => {
      fetchItems(searchQuery);
    }, 500);

    return () => {
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }
    };
  }, [searchQuery, fetchItems]);

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleAddToCart = (item) => {
    const stockQuantity = Number(item.stockQuantity) || 0;

    if (stockQuantity <= 0) {
      toast.error("Item is out of stock");
      return;
    }

    const existingItem = cartItems.find((i) => i._id === item._id);
    if (existingItem && existingItem.quantity >= stockQuantity) {
      toast.error("Cannot add more than available stock");
      return;
    }

    addItem(item);
    toast.success(`${item.name} added to cart`, { duration: 1500 });
  };

  const subtotal = getTotal();

  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const taxAmount =
    taxType === "percentage" ? (afterDiscount * taxValue) / 100 : taxValue;

  const finalTotal = afterDiscount + taxAmount;

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setProcessing(true);

    try {
      const saleData = {
        items: cartItems.map((item) => ({
          item: item._id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
        })),
        paymentMethod,
        paymentStatus: "paid",
        amountPaid: finalTotal,
        customer:
          customer.name || customer.phone || customer.email
            ? customer
            : undefined,
        notes: notes || undefined,
        discount:
          discountValue > 0
            ? {
                type: discountType,
                value: discountValue,
                amount: discountAmount,
              }
            : undefined,
        tax:
          taxValue > 0
            ? {
                type: taxType,
                value: taxValue,
                amount: taxAmount,
              }
            : undefined,
      };

      await salesAPI.create(saleData);

      toast.success("Sale completed successfully! 🎉", { duration: 3000 });

      clearCart();
      setCustomer({ name: "", phone: "", email: "", address: "" });
      setNotes("");
      setDiscountValue(0);
      setTaxValue(0);

      // Refresh items after sale
      console.log("🔄 Refreshing items after sale...");
      await fetchItems(searchQuery);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete sale");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto max-w-[2000px] p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] xl:grid-cols-[1fr,480px] gap-4 md:gap-6 lg:gap-8">
          {/* Left Panel - Items Grid */}
          <div className="flex flex-col min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-10rem)]">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                    New Sale
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
                    Browse and add items to cart
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
                    onClick={() => fetchItems(searchQuery)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    <span className="font-medium">Refresh</span>
                  </Button>
                  <Link href="/dashboard/sales/history">
                    <Button
                      variant="outline"
                      size="default"
                      className="gap-2 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
                    >
                      <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="font-medium">History</span>
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  placeholder="Search items by name or SKU..."
                  className="pl-9 sm:pl-10 lg:pl-11 h-10 sm:h-11 lg:h-12 text-xs sm:text-sm lg:text-base bg-background shadow-sm"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </motion.div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
                  {[...Array(10)].map((_, i) => (
                    <Card key={i} className="overflow-hidden h-full">
                      <div className="aspect-square skeleton" />
                      <CardContent className="p-2.5 sm:p-3 lg:p-4 space-y-2 sm:space-y-3">
                        <div className="space-y-2">
                          <div className="h-4 skeleton rounded" />
                          <div className="h-3 skeleton rounded w-2/3" />
                        </div>
                        <div className="flex justify-between items-center pt-2 sm:pt-3 border-t">
                          <div className="h-5 sm:h-6 skeleton rounded w-16 sm:w-20" />
                          <div className="h-8 sm:h-9 skeleton rounded w-12 sm:w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : items.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
                  {items.map((item) => (
                    <ItemCard
                      key={item._id}
                      item={item}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 sm:py-16 md:py-20 lg:py-24">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-muted/50 mb-3 sm:mb-4 lg:mb-6">
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2">
                        No items found
                      </h3>
                      <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-sm mx-auto px-4">
                        {searchQuery
                          ? "Try adjusting your search terms"
                          : "No items available in inventory"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Panel - Cart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]"
          >
            <Card className="flex flex-col h-full shadow-lg border-border/50">
              <CardHeader className="border-b bg-muted/30 pb-3 sm:pb-4 lg:pb-5 flex-shrink-0">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="flex-1 font-bold">
                    Cart ({cartItems.length})
                  </span>
                  {cartItems.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 sm:h-9 text-xs sm:text-sm font-medium"
                      onClick={clearCart}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {cartItems.length > 0 ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-5 pt-3 sm:pt-4 lg:pt-5">
                      <AnimatePresence>
                        {cartItems.map((item) => (
                          <CartItem
                            key={item._id}
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeItem}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Checkout Section */}
                    <div className="overflow-y-auto px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5 border-t bg-muted/20">
                      <div className="space-y-3 sm:space-y-4 lg:space-y-5 pt-3 sm:pt-4 lg:pt-5">
                        {/* Discount Section */}
                        <div className="space-y-2 sm:space-y-2.5">
                          <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Discount (Optional)
                          </Label>
                          <div className="flex gap-2">
                            <select
                              className="h-9 sm:h-10 lg:h-11 px-2 sm:px-3 rounded-lg border text-xs sm:text-sm bg-background w-16 sm:w-20 lg:w-24 font-medium"
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value)}
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">₦</option>
                            </select>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={discountValue || ""}
                              onChange={(e) =>
                                setDiscountValue(
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        {/* Tax Section */}
                        <div className="space-y-2 sm:space-y-2.5">
                          <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Tax (Optional)
                          </Label>
                          <div className="flex gap-2">
                            <select
                              className="h-9 sm:h-10 lg:h-11 px-2 sm:px-3 rounded-lg border text-xs sm:text-sm bg-background w-16 sm:w-20 lg:w-24 font-medium"
                              value={taxType}
                              onChange={(e) => setTaxType(e.target.value)}
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">₦</option>
                            </select>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={taxValue || ""}
                              onChange={(e) =>
                                setTaxValue(parseFloat(e.target.value) || 0)
                              }
                              className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        {/* Customer Section */}
                        <div className="space-y-2 sm:space-y-2.5 pt-2 border-t">
                          <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Customer (Optional)
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              placeholder="Name"
                              value={customer.name}
                              onChange={(e) =>
                                setCustomer({
                                  ...customer,
                                  name: e.target.value,
                                })
                              }
                              className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
                            />
                            <Input
                              placeholder="Phone"
                              value={customer.phone}
                              onChange={(e) =>
                                setCustomer({
                                  ...customer,
                                  phone: e.target.value,
                                })
                              }
                              className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2 sm:space-y-2.5">
                          <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Payment Method
                          </Label>
                          <select
                            className="h-10 sm:h-11 lg:h-12 w-full px-2 sm:px-3 rounded-lg border text-xs sm:text-sm bg-background font-medium"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="transfer">Bank Transfer</option>
                            <option value="pos">POS</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2 sm:space-y-2.5">
                          <Label className="text-xs sm:text-sm font-semibold">
                            Notes (Optional)
                          </Label>
                          <textarea
                            placeholder="Add transaction notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            maxLength={500}
                            className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border text-xs sm:text-sm bg-background resize-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        {/* Total Summary */}
                        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 lg:p-5 space-y-2 sm:space-y-3">
                          <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                            <span className="text-muted-foreground font-medium">
                              Subtotal
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(subtotal)}
                            </span>
                          </div>

                          {discountValue > 0 && (
                            <div className="flex justify-between text-xs sm:text-sm lg:text-base text-green-600 dark:text-green-400">
                              <span className="font-medium">
                                Discount ({discountValue}
                                {discountType === "percentage" ? "%" : "₦"})
                              </span>
                              <span className="font-semibold">
                                -{formatCurrency(discountAmount)}
                              </span>
                            </div>
                          )}

                          {taxValue > 0 && (
                            <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                              <span className="text-muted-foreground font-medium">
                                Tax ({taxValue}
                                {taxType === "percentage" ? "%" : "₦"})
                              </span>
                              <span className="font-semibold">
                                {formatCurrency(taxAmount)}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between text-lg sm:text-xl lg:text-2xl font-bold pt-2 sm:pt-3 border-t border-primary/20">
                            <span>Total</span>
                            <span className="text-primary">
                              {formatCurrency(finalTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Complete Sale Button */}
                        <Button
                          onClick={handleCompleteSale}
                          disabled={processing}
                          className="w-full h-11 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg font-semibold shadow-lg"
                          size="lg"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                              Complete · {formatCurrency(finalTotal)}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
                    <div className="text-center max-w-xs">
                      <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-muted/50 mb-4 sm:mb-5 lg:mb-6">
                        <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-muted-foreground/30" />
                      </div>
                      <h3 className="font-semibold text-base sm:text-lg lg:text-xl mb-2">
                        Cart is empty
                      </h3>
                      <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                        Browse items from the catalog and click "Add" to start a
                        new sale
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
