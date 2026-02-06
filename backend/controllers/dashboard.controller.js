const { Item, Sale, Alert, User, Category, AuditLog } = require('../models');
const { asyncHandler } = require('../utils/AppError');

/**
 * Get dashboard overview
 */
exports.getDashboardOverview = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const [
    // Inventory stats
    totalItems,
    availableItems,
    lowStockItems,
    outOfStockItems,
    totalInventoryValue,
    
    // Sales stats
    todaySales,
    monthSales,
    todayRevenue,
    monthRevenue,
    todayProfit,
    monthProfit,
    
    // Alert stats
    unresolvedAlerts,
    criticalAlerts,
    
    // User stats
    totalUsers,
    activeUsers,
    
    // Recent data
    recentSales,
    recentItems,
    topSellingItems
  ] = await Promise.all([
    // Inventory
    Item.countDocuments({ isActive: true }),
    Item.countDocuments({ isActive: true, stockStatus: 'available' }),
    Item.countDocuments({ isActive: true, stockStatus: 'low_stock' }),
    Item.countDocuments({ isActive: true, stockStatus: 'out_of_stock' }),
    Item.getTotalInventoryValue(),
    
    // Sales
    Sale.countDocuments({ saleDate: { $gte: today }, status: 'completed' }),
    Sale.countDocuments({ saleDate: { $gte: thisMonth }, status: 'completed' }),
    Sale.aggregate([
      { $match: { saleDate: { $gte: today }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Sale.aggregate([
      { $match: { saleDate: { $gte: thisMonth }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Sale.aggregate([
      { $match: { saleDate: { $gte: today }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalProfit' } } }
    ]),
    Sale.aggregate([
      { $match: { saleDate: { $gte: thisMonth }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalProfit' } } }
    ]),
    
    // Alerts
    Alert.countDocuments({ isResolved: false }),
    Alert.countDocuments({ isResolved: false, severity: 'critical' }),
    
    // Users
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    
    // Recent data
    Sale.find({ status: 'completed' })
      .sort({ saleDate: -1 })
      .limit(5)
      .populate('soldBy', 'firstName lastName'),
    Item.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name'),
    Sale.getTopSellingItems(5)
  ]);

  res.json({
    status: 'success',
    data: {
      inventory: {
        totalItems,
        availableItems,
        lowStockItems,
        outOfStockItems,
        totalValue: totalInventoryValue
      },
      sales: {
        today: {
          count: todaySales,
          revenue: todayRevenue[0]?.total || 0,
          profit: todayProfit[0]?.total || 0
        },
        month: {
          count: monthSales,
          revenue: monthRevenue[0]?.total || 0,
          profit: monthProfit[0]?.total || 0
        }
      },
      alerts: {
        unresolved: unresolvedAlerts,
        critical: criticalAlerts
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      recentSales,
      recentItems,
      topSellingItems
    }
  });
});

/**
 * Get sales analytics
 */
exports.getSalesAnalytics = asyncHandler(async (req, res, next) => {
  const { period = 'month' } = req.query;

  let startDate = new Date();
  const endDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  const [stats, dailyTrend, topItems, paymentMethods] = await Promise.all([
    Sale.getSalesStatistics(startDate, endDate),
    Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
            day: { $dayOfMonth: '$saleDate' }
          },
          sales: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$totalProfit' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          sales: 1,
          revenue: 1,
          profit: 1
        }
      }
    ]),
    Sale.getTopSellingItems(10, startDate, endDate),
    Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ])
  ]);

  res.json({
    status: 'success',
    data: {
      period: {
        start: startDate,
        end: endDate
      },
      statistics: stats,
      dailyTrend,
      topItems,
      paymentMethods
    }
  });
});

/**
 * Get inventory analytics
 */
exports.getInventoryAnalytics = asyncHandler(async (req, res, next) => {
  const [
    categoryBreakdown,
    stockStatusDistribution,
    valueDistribution,
    lowStockItems,
    topValueItems
  ] = await Promise.all([
    Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: 'category',
          as: 'items'
        }
      },
      {
        $project: {
          name: 1,
          itemCount: { $size: '$items' },
          totalValue: {
            $sum: {
              $map: {
                input: '$items',
                as: 'item',
                in: { $multiply: ['$$item.costPrice', '$$item.stockQuantity'] }
              }
            }
          },
          totalStock: { $sum: '$items.stockQuantity' }
        }
      },
      { $sort: { itemCount: -1 } }
    ]),
    Item.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$stockStatus',
          count: { $sum: 1 }
        }
      }
    ]),
    Item.aggregate([
      { $match: { isActive: true } },
      {
        $bucket: {
          groupBy: { $multiply: ['$costPrice', '$stockQuantity'] },
          boundaries: [0, 10000, 50000, 100000, 500000, 1000000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            items: { $push: '$$ROOT' }
          }
        }
      }
    ]),
    Item.getLowStockItems(),
    Item.find({ isActive: true })
      .sort({ inventoryValue: -1 })
      .limit(10)
      .populate('category', 'name')
  ]);

  res.json({
    status: 'success',
    data: {
      categoryBreakdown,
      stockStatusDistribution,
      valueDistribution,
      lowStockItems: lowStockItems.slice(0, 10),
      topValueItems
    }
  });
});

/**
 * Get recent activity
 */
exports.getRecentActivity = asyncHandler(async (req, res, next) => {
  const { limit = 20 } = req.query;

  const activities = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate('actor', 'firstName lastName email');

  res.json({
    status: 'success',
    results: activities.length,
    data: {
      activities
    }
  });
});

/**
 * Get executive summary
 */
exports.getExecutiveSummary = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    todayStats,
    yesterdayStats,
    weekStats,
    monthStats,
    inventoryValue,
    criticalAlerts,
    topProducts
  ] = await Promise.all([
    Sale.getSalesStatistics(today, new Date()),
    Sale.getSalesStatistics(yesterday, today),
    Sale.getSalesStatistics(lastWeek, new Date()),
    Sale.getSalesStatistics(lastMonth, new Date()),
    Item.getTotalInventoryValue(),
    Alert.getCriticalAlerts(),
    Sale.getTopSellingItems(5, lastMonth, new Date())
  ]);

  // Calculate growth rates
  const revenueGrowth = yesterdayStats.totalRevenue > 0
    ? ((todayStats.totalRevenue - yesterdayStats.totalRevenue) / yesterdayStats.totalRevenue) * 100
    : 0;

  const salesGrowth = yesterdayStats.totalSales > 0
    ? ((todayStats.totalSales - yesterdayStats.totalSales) / yesterdayStats.totalSales) * 100
    : 0;

  res.json({
    status: 'success',
    data: {
      today: todayStats,
      yesterday: yesterdayStats,
      week: weekStats,
      month: monthStats,
      growth: {
        revenue: revenueGrowth,
        sales: salesGrowth
      },
      inventory: {
        totalValue: inventoryValue
      },
      alerts: {
        critical: criticalAlerts.length,
        items: criticalAlerts.slice(0, 5)
      },
      topProducts
    }
  });
});

module.exports = exports;