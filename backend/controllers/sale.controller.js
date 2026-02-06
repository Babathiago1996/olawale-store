const { Sale, Item, AuditLog } = require("../models");
const { AppError, asyncHandler } = require("../utils/AppError");

/**
 * Create new sale
 */
/**
 * Create new sale
 */
exports.createSale = asyncHandler(async (req, res, next) => {
  const {
    items,
    paymentMethod,
    paymentStatus,
    amountPaid,
    customer,
    notes,
    discount,
    tax,
  } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError("Sale must contain at least one item", 400));
  }

  // Validate and prepare sale items
  const saleItems = [];
  for (const saleItem of items) {
    // ✅ FIXED: Force to number
    const quantity = Number(saleItem.quantity);
    
    if (!quantity || quantity <= 0 || isNaN(quantity)) {
      return next(new AppError("Quantity must be a valid positive number", 400));
    }

    const item = await Item.findById(saleItem.item);

    if (!item) {
      return next(new AppError(`Item ${saleItem.item} not found`, 404));
    }

    if (!item.isActive) {
      return next(new AppError(`Item ${item.name} is not active`, 400));
    }

    // ✅ FIXED: Compare numbers properly
    if (Number(item.stockQuantity) < quantity) {
      return next(
        new AppError(
          `Insufficient stock for ${item.name}. Available: ${item.stockQuantity}, Requested: ${quantity}`,
          400,
        ),
      );
    }

    saleItems.push({
      item: item._id,
      itemName: item.name,
      itemSKU: item.sku,
      quantity: quantity,
      unitPrice:
        typeof saleItem.unitPrice === "number"
          ? Number(saleItem.unitPrice)
          : Number(item.sellingPrice),
      unitCost: Number(item.costPrice),
    });
  }

  // Generate sale number
  const saleNumber = await Sale.generateSaleNumber();

  // Create sale
  const sale = await Sale.create({
    saleNumber,
    items: saleItems,
    paymentMethod,
    paymentStatus,
    amountPaid: Number(amountPaid) || 0,
    customer,
    notes,
    discount,
    tax,
    soldBy: req.userId,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  // ✅ REMOVED: Stock update logic (now handled by post-save hook in sale.model.js)
  // The post-save middleware will automatically handle stock reduction

  // Log action
  await AuditLog.logAction({
    action: "sale.create",
    resource: "sale",
    resourceId: sale._id,
    resourceModel: "Sale",
    actor: req.userId,
    description: `Created sale ${sale.saleNumber} - ₦${Number(sale.totalAmount || 0).toLocaleString()}`,
    metadata: {
      totalAmount: sale.totalAmount,
      totalProfit: sale.totalProfit,
      itemCount: sale.totalItems,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  res.status(201).json({
    status: "success",
    message: "Sale created successfully",
    data: {
      sale,
    },
  });
});

/**
 * Get all sales with filtering and pagination
 */
exports.getAllSales = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    startDate,
    endDate,
    soldBy,
    sortBy = "saleDate",
    order = "desc",
  } = req.query;

  // Build query
  const query = {};

  if (status) {
    query.status = status;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  if (soldBy) {
    query.soldBy = soldBy;
  }

  if (startDate || endDate) {
    query.saleDate = {};
    if (startDate) query.saleDate.$gte = new Date(startDate);
    if (endDate) query.saleDate.$lte = new Date(endDate);
  }

  // Build sort
  const sort = {};
  sort[sortBy] = order === "asc" ? 1 : -1;

  // Execute query with pagination
  const skip = (Number(page) - 1) * Number(limit);

  const [sales, total] = await Promise.all([
    Sale.find(query)
      .populate("soldBy", "firstName lastName email")
      .populate("items.item", "name sku images")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Sale.countDocuments(query),
  ]);

  res.json({
    status: "success",
    results: sales.length,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
    data: {
      sales,
    },
  });
});

/**
 * Get single sale by ID
 */
exports.getSaleById = asyncHandler(async (req, res, next) => {
  const sale = await Sale.findById(req.params.id)
    .populate("soldBy", "firstName lastName email phone")
    .populate("items.item", "name sku images category")
    .populate("metadata.refundedBy", "firstName lastName");

  if (!sale) {
    return next(new AppError("Sale not found", 404));
  }

  res.json({
    status: "success",
    data: {
      sale,
    },
  });
});

/**
 * Cancel sale
 */
exports.cancelSale = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    return next(new AppError("Sale not found", 404));
  }

  if (sale.status !== "completed") {
    return next(new AppError("Only completed sales can be cancelled", 400));
  }

  // Cancel sale (this will restore stock)
  await sale.cancelSale(req.userId, reason);

  // Log action
  await AuditLog.logAction({
    action: "sale.cancel",
    resource: "sale",
    resourceId: sale._id,
    resourceModel: "Sale",
    actor: req.userId,
    description: `Cancelled sale ${sale.saleNumber}`,
    severity: "high",
    metadata: {
      reason,
      totalAmount: sale.totalAmount,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  res.json({
    status: "success",
    message: "Sale cancelled successfully",
    data: {
      sale,
    },
  });
});

/**
 * Get sales statistics
 */
exports.getSalesStats = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, period = "today" } = req.query;

  let start, end;

  // Determine date range based on period
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();

    switch (period) {
      case "today":
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        break;
      case "year":
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date();
        start.setHours(0, 0, 0, 0);
    }
  }

  const stats = await Sale.getSalesStatistics(start, end);

  res.json({
    status: "success",
    data: {
      period: {
        start,
        end,
      },
      ...stats,
    },
  });
});

/**
 * Get top selling items
 */
exports.getTopSellingItems = asyncHandler(async (req, res, next) => {
  const { limit = 10, startDate, endDate } = req.query;

  let start, end;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  }

  const topItems = await Sale.getTopSellingItems(Number(limit), start, end);

  res.json({
    status: "success",
    results: topItems.length,
    data: {
      items: topItems,
    },
  });
});

/**
 * Get daily sales report
 */
exports.getDailySalesReport = asyncHandler(async (req, res, next) => {
  const { days = 30 } = req.query;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  const dailyReport = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
        status: "completed",
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$saleDate" },
          month: { $month: "$saleDate" },
          day: { $dayOfMonth: "$saleDate" },
        },
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        totalProfit: { $sum: "$totalProfit" },
        totalItems: { $sum: "$totalItems" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
          },
        },
        totalSales: 1,
        totalRevenue: 1,
        totalProfit: 1,
        totalItems: 1,
        averageSaleValue: { $divide: ["$totalRevenue", "$totalSales"] },
      },
    },
  ]);

  res.json({
    status: "success",
    results: dailyReport.length,
    data: {
      report: dailyReport,
    },
  });
});

/**
 * Get monthly sales report
 */
exports.getMonthlySalesReport = asyncHandler(async (req, res, next) => {
  const { months = 12 } = req.query;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - Number(months));

  const monthlyReport = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
        status: "completed",
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$saleDate" },
          month: { $month: "$saleDate" },
        },
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        totalProfit: { $sum: "$totalProfit" },
        totalItems: { $sum: "$totalItems" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: 1,
          },
        },
        totalSales: 1,
        totalRevenue: 1,
        totalProfit: 1,
        totalItems: 1,
        averageSaleValue: { $divide: ["$totalRevenue", "$totalSales"] },
        profitMargin: {
          $multiply: [{ $divide: ["$totalProfit", "$totalRevenue"] }, 100],
        },
      },
    },
  ]);

  res.json({
    status: "success",
    results: monthlyReport.length,
    data: {
      report: monthlyReport,
    },
  });
});

/**
 * Get sales by payment method
 */
exports.getSalesByPaymentMethod = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = { status: "completed" };

  if (startDate || endDate) {
    query.saleDate = {};
    if (startDate) query.saleDate.$gte = new Date(startDate);
    if (endDate) query.saleDate.$lte = new Date(endDate);
  }

  const paymentMethodStats = await Sale.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        averageAmount: { $avg: "$totalAmount" },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  res.json({
    status: "success",
    data: {
      paymentMethods: paymentMethodStats,
    },
  });
});

/**
 * Update payment status
 */
exports.updatePaymentStatus = asyncHandler(async (req, res, next) => {
  const { paymentStatus, amountPaid } = req.body;

  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    return next(new AppError("Sale not found", 404));
  }

  if (sale.status !== "completed") {
    return next(
      new AppError("Cannot update payment for non-completed sales", 400),
    );
  }

  if (paymentStatus) {
    sale.paymentStatus = paymentStatus;
  }

  if (amountPaid !== undefined) {
    sale.amountPaid = amountPaid;
  }

  await sale.save();

  // Log action
  await AuditLog.logAction({
    action: "sale.update",
    resource: "sale",
    resourceId: sale._id,
    resourceModel: "Sale",
    actor: req.userId,
    description: `Updated payment status for sale ${sale.saleNumber}`,
    metadata: {
      paymentStatus,
      amountPaid,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  res.json({
    status: "success",
    message: "Payment status updated successfully",
    data: {
      sale,
    },
  });
});

module.exports = exports;
