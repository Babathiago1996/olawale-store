const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    itemSKU: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    unitCost: {
      type: Number,
      required: [true, "Unit cost is required"],
      min: [0, "Unit cost cannot be negative"],
    },
    subtotal: {
      type: Number,
    },
    profit: {
      type: Number,
    },
  },
  { _id: true },
);

const saleSchema = new mongoose.Schema(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    items: {
      type: [saleItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "Sale must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      min: [0, "Total amount cannot be negative"],
    },
    totalCost: {
      type: Number,
      min: [0, "Total cost cannot be negative"],
    },
    totalProfit: {
      type: Number,
    },
    totalItems: {
      type: Number,
      min: [1, "Total items must be at least 1"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer", "pos", "other"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "partial", "refunded"],
      default: "paid",
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
    },
    amountDue: {
      type: Number,
      default: 0,
      min: [0, "Amount due cannot be negative"],
    },
    customer: {
      name: String,
      phone: String,
      email: String,
      address: String,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    discount: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "fixed",
      },
      value: {
        type: Number,
        default: 0,
        min: [0, "Discount cannot be negative"],
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    tax: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
      value: {
        type: Number,
        default: 0,
        min: [0, "Tax cannot be negative"],
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["completed", "cancelled", "refunded"],
      default: "completed",
    },
    saleDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      device: String,
      refundReason: String,
      refundedAt: Date,
      refundedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ soldBy: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ "items.item": 1 });

// Virtual for profit margin
saleSchema.virtual("profitMargin").get(function () {
  if (this.totalCost === 0) return 0;
  return (this.totalProfit / this.totalCost) * 100;
});

// Virtual for payment completion
saleSchema.virtual("isFullyPaid").get(function () {
  return this.amountPaid >= this.totalAmount;
});

// Pre-save middleware to calculate totals
saleSchema.pre("save", function (next) {
  // Calculate subtotals and profits for each item
  this.items.forEach((item) => {
    item.subtotal = item.quantity * item.unitPrice;
    item.profit = (item.unitPrice - item.unitCost) * item.quantity;
  });

  // Calculate total cost
  this.totalCost = this.items.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0,
  );

  // Calculate subtotal before discount and tax
  let subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Calculate discount amount
  if (this.discount && this.discount.value > 0) {
    if (this.discount.type === "percentage") {
      this.discount.amount = (subtotal * this.discount.value) / 100;
    } else {
      this.discount.amount = this.discount.value;
    }
  } else {
    this.discount.amount = 0;
  }

  // Apply discount
  subtotal -= this.discount.amount;

  // Calculate tax amount
  if (this.tax && this.tax.value > 0) {
    if (this.tax.type === "percentage") {
      this.tax.amount = (subtotal * this.tax.value) / 100;
    } else {
      this.tax.amount = this.tax.value;
    }
  } else {
    this.tax.amount = 0;
  }
  // Prevent negative totals
  subtotal = Math.max(0, subtotal);
  this.totalAmount = Math.max(0, subtotal + this.tax.amount);

  // Calculate total profit
  this.totalProfit =
    this.items.reduce((sum, item) => sum + item.profit, 0) -
    this.discount.amount;

  // Calculate total items
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate amount due
  this.amountDue = Math.max(0, this.totalAmount - this.amountPaid);

  // Update payment status
  if (this.amountPaid >= this.totalAmount) {
    this.paymentStatus = "paid";
  } else if (this.amountPaid > 0) {
    this.paymentStatus = "partial";
  } else {
    this.paymentStatus = "pending";
  }

  next();
});

// Post-save middleware to update item stock and statistics
// saleSchema.post('save', async function(doc) {
//   if (doc.status === 'completed' && !doc.wasNew) {
//     return; // Don't update stock again if already processed
//   }

//   if (doc.status === 'completed') {
//     const Item = mongoose.model('Item');

//     // Update stock for each item
//     for (const saleItem of doc.items) {
//       try {
//         const item = await Item.findById(saleItem.item);
//         if (item) {
//           await item.reduceStock(saleItem.quantity);
//         }
//       } catch (error) {
//         console.error(`Error updating stock for item ${saleItem.item}:`, error);
//       }
//     }
//   }
// });
// ✅ FIXED: Track if document is new before save
saleSchema.pre('save', function (next) {
  this._wasNew = this.isNew;
  next();
});

// ✅ FIXED: POST-SAVE MIDDLEWARE - Updates item stock after sale
saleSchema.post('save', async function (doc) {
  // Only process new completed sales
  if (!doc._wasNew || doc.status !== 'completed') {
    return;
  }

  console.log(`📦 Processing stock updates for sale ${doc.saleNumber}`);
  
  const Item = mongoose.model('Item');
  
  // Update stock for each item in the sale
  for (const saleItem of doc.items) {
    try {
      const item = await Item.findById(saleItem.item);
      
      if (!item) {
        console.error(`❌ Item ${saleItem.item} not found for stock update`);
        continue;
      }

      // Use the reduceStock method which handles all stock updates
      await item.reduceStock(saleItem.quantity);
      
      console.log(`✅ Stock reduced for ${item.name}: -${saleItem.quantity} (New: ${item.stockQuantity})`);
      
    } catch (error) {
      console.error(`❌ Error updating stock for item ${saleItem.item}:`, error.message);
      // Continue processing other items even if one fails
    }
  }
  
  console.log(`✅ Stock updates completed for sale ${doc.saleNumber}`);
});

// Method to generate unique sale number
saleSchema.statics.generateSaleNumber = async function () {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999)),
    },
  });

  const sequence = (count + 1).toString().padStart(4, "0");

  return `SALE-${year}${month}${day}-${sequence}`;
};

// Method to cancel sale
saleSchema.methods.cancelSale = async function (userId, reason) {
  if (this.status !== "completed") {
    throw new Error("Only completed sales can be cancelled");
  }

  this.status = "cancelled";
  this.metadata.refundReason = reason;
  this.metadata.refundedAt = new Date();
  this.metadata.refundedBy = userId;

  // Restore stock
  const Item = mongoose.model("Item");
  for (const saleItem of this.items) {
    const item = await Item.findById(saleItem.item);
    if (item) {
      item.stockQuantity += saleItem.quantity;
      item.totalSold -= saleItem.quantity;
      item.totalRevenue -= saleItem.subtotal;
      await item.save();
    }
  }

  return await this.save();
};

// Static method to get sales by date range
saleSchema.statics.getSalesByDateRange = function (
  startDate,
  endDate,
  status = "completed",
) {
  return this.find({
    saleDate: { $gte: startDate, $lte: endDate },
    status: status,
  })
    .populate("soldBy", "firstName lastName email")
    .populate("items.item", "name sku category")
    .sort({ saleDate: -1 });
};

// Static method to get sales statistics
saleSchema.statics.getSalesStatistics = async function (startDate, endDate) {
  const sales = await this.find({
    saleDate: { $gte: startDate, $lte: endDate },
    status: "completed",
  });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.totalProfit, 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.totalItems, 0);
  const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return {
    totalSales,
    totalRevenue,
    totalProfit,
    totalItemsSold,
    averageSaleValue,
    profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
  };
};

// Static method to get top selling items
saleSchema.statics.getTopSellingItems = async function (
  limit = 10,
  startDate,
  endDate,
) {
  const matchStage = {
    status: "completed",
  };

  if (startDate && endDate) {
    matchStage.saleDate = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.item",
        itemName: { $first: "$items.itemName" },
        itemSKU: { $first: "$items.itemSKU" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
        totalProfit: { $sum: "$items.profit" },
        salesCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
  ]);
};

// Prevent modification of completed sales (immutability)
saleSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (
    update.$set &&
    update.$set.status &&
    this._conditions.status === "completed"
  ) {
    return next(new Error("Completed sales cannot be modified directly"));
  }
  next();
});

module.exports = mongoose.models.Sale || mongoose.model("Sale", saleSchema);
