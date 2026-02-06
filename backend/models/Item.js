const mongoose = require("mongoose");
require("./Alert");
require("./User");
const emailService = require("../services/email.service");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [200, "Item name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },
    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, "Low stock threshold cannot be negative"],
    },
    stockStatus: {
      type: String,
      enum: ["available", "low_stock", "out_of_stock"],
      default: "available",
    },
    unit: {
      type: String,
      default: "piece",
      trim: true,
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ["kg", "g", "lb", "oz"],
        default: "kg",
      },
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ["cm", "m", "in", "ft"],
        default: "cm",
      },
    },
    restockHistory: [
      {
        quantity: {
          type: Number,
          required: true,
        },
        costPrice: {
          type: Number,
          required: true,
        },
        supplier: String,
        reference: String,
        notes: String,
        restockedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        restockedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalRestocked: {
      type: Number,
      default: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    metadata: {
      views: {
        type: Number,
        default: 0,
      },
      lastRestocked: Date,
      lastSold: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
itemSchema.index({ sku: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ stockStatus: 1 });
itemSchema.index({ isActive: 1 });
itemSchema.index({ name: "text", description: "text", tags: "text" });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ stockQuantity: 1 });
itemSchema.index({ lowStockThreshold: 1 });

// Virtual for profit margin
itemSchema.virtual("profitMargin").get(function () {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice) * 100;
});

// Virtual for profit per unit
itemSchema.virtual("profitPerUnit").get(function () {
  return this.sellingPrice - this.costPrice;
});

// Virtual for total inventory value
itemSchema.virtual("inventoryValue").get(function () {
  return this.costPrice * this.stockQuantity;
});

// Virtual for potential revenue
itemSchema.virtual("potentialRevenue").get(function () {
  return this.sellingPrice * this.stockQuantity;
});

// Virtual for primary image
itemSchema.virtual("primaryImage").get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary || (this.images.length > 0 ? this.images[0] : null);
});

// Pre-save middleware to track stock status changes
// Pre-save middleware to track stock status changes
itemSchema.pre("save", function (next) {
  // Track if stock-related fields changed
  if (
    this.isModified("stockQuantity") ||
    this.isModified("lowStockThreshold")
  ) {
    this._stockStatusChanged = true;
    this._previousStockStatus = this.stockStatus;
  }

  // ✅ CRITICAL FIX: Force to numbers to prevent string comparison bugs
  const qty = Number(this.stockQuantity) || 0;
  const threshold = Number(this.lowStockThreshold) || 10;

  // Store old status before calculation
  const oldStatus = this.stockStatus;

  // ✅ FIXED: Correct stock status calculation logic
  if (qty <= 0) {
    this.stockStatus = "out_of_stock";
  } else if (qty > 0 && qty <= threshold) {
    // ✅ Added qty > 0 check
    this.stockStatus = "low_stock";
  } else {
    this.stockStatus = "available";
  }

  // Track if status actually changed
  if (oldStatus !== this.stockStatus) {
    this._stockStatusChanged = true;
    this._previousStockStatus = oldStatus;
  }

  // Ensure primary image exists
  if (this.images.length > 0) {
    const hasPrimary = this.images.some((img) => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }

  next();
});

// ✅ FIXED: POST-SAVE MIDDLEWARE - Handles alerts and auto-resolution
itemSchema.post("save", async function (doc) {
  // Only trigger if stock status actually changed
  if (!doc._stockStatusChanged) {
    return;
  }

  try {
    const Alert = mongoose.model("Alert");
    const User = mongoose.model("User");

    // ✅ NEW: Auto-resolve old alerts when stock becomes available again
    if (
      doc.stockStatus === "available" &&
      doc._previousStockStatus !== "available"
    ) {
      console.log(`✅ Stock restored for ${doc.name} - Resolving old alerts`);

      await Alert.updateMany(
        {
          item: doc._id,
          type: { $in: ["low_stock", "out_of_stock"] },
          isResolved: false,
        },
        {
          $set: {
            isResolved: true,
            resolvedAt: new Date(),
            resolutionNotes: "Stock replenished - auto-resolved",
          },
        },
      );

      console.log(`✅ Old alerts resolved for ${doc.name}`);
      return; // Exit early - no need to create new alerts
    }

    // Check if we need to create a new alert (stock became low or out)
    const shouldCreateAlert =
      doc.stockStatus === "low_stock" || doc.stockStatus === "out_of_stock";

    if (!shouldCreateAlert) {
      console.log(
        `ℹ️  Stock status for ${doc.name} is ${doc.stockStatus} - no alert needed`,
      );
      return;
    }

    console.log(
      `📧 Checking alert for ${doc.name} - Status: ${doc.stockStatus}`,
    );

    // ✅ FIXED: Check for existing unresolved alert with correct query
    const existingAlert = await Alert.findOne({
      item: doc._id,
      type: doc.stockStatus === "out_of_stock" ? "out_of_stock" : "low_stock",
      isResolved: false,
    });

    if (existingAlert) {
      console.log(
        `ℹ️  Unresolved alert already exists for ${doc.name} - Skipping`,
      );
      return;
    }

    // Create new alert in database
    const newAlert = await Alert.create({
      type: doc.stockStatus === "out_of_stock" ? "out_of_stock" : "low_stock",
      severity: doc.stockStatus === "out_of_stock" ? "critical" : "warning",
      item: doc._id,
      message:
        doc.stockStatus === "out_of_stock"
          ? `${doc.name} is out of stock`
          : `${doc.name} stock is running low (${doc.stockQuantity} ${doc.unit} remaining)`,
      metadata: {
        currentStock: doc.stockQuantity,
        threshold: doc.lowStockThreshold,
        sku: doc.sku,
      },
    });

    console.log(`✅ Alert created in DB for ${doc.name} (ID: ${newAlert._id})`);

    // Send emails to all active admins
    try {
      const admins = await User.find({
        role: "admin",
        isActive: true,
      }).select("email firstName");

      if (!admins || admins.length === 0) {
        console.log("⚠️  No active admin users found to send stock alerts");
        return;
      }

      console.log(`📧 Sending emails to ${admins.length} admin(s)`);

      const emailPromises = admins.map(async (admin) => {
        try {
          if (doc.stockStatus === "out_of_stock") {
            await emailService.sendOutOfStockAlert(
              admin.email,
              doc.name,
              doc.sku,
            );
            console.log(`✅ Out of stock email sent to ${admin.email}`);
          } else {
            await emailService.sendLowStockAlert(
              admin.email,
              doc.name,
              doc.stockQuantity,
              doc.lowStockThreshold,
            );
            console.log(`✅ Low stock email sent to ${admin.email}`);
          }
        } catch (emailError) {
          console.error(
            `❌ Failed to send email to ${admin.email}:`,
            emailError.message,
          );
        }
      });

      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      console.error("❌ Email sending error:", emailError);
    }
  } catch (error) {
    console.error("❌ Post-save stock alert error:", error);
  }
});

// Method to add restock
itemSchema.methods.addRestock = async function (
  quantity,
  costPrice,
  userId,
  details = {},
) {
  this.stockQuantity += quantity;
  this.totalRestocked += quantity;
  this.metadata.lastRestocked = new Date();

  this.restockHistory.push({
    quantity,
    costPrice,
    supplier: details.supplier,
    reference: details.reference,
    notes: details.notes,
    restockedBy: userId,
  });

  // Update cost price if provided and different
  if (costPrice && costPrice !== this.costPrice) {
    this.costPrice = costPrice;
  }

  return await this.save();
};

// Method to reduce stock (for sales)
itemSchema.methods.reduceStock = async function (quantity) {
  if (this.stockQuantity < quantity) {
    throw new Error("Insufficient stock");
  }

  this.stockQuantity -= quantity;
  this.totalSold += quantity;
  this.totalRevenue += this.sellingPrice * quantity;
  this.metadata.lastSold = new Date();

  return await this.save();
};

// Method to set primary image
itemSchema.methods.setPrimaryImage = async function (imageId) {
  this.images.forEach((img) => {
    img.isPrimary = img._id.toString() === imageId.toString();
  });
  return await this.save();
};

// Static method to generate unique SKU
itemSchema.statics.generateSKU = async function (categoryPrefix = "ITEM") {
  const count = await this.countDocuments();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${categoryPrefix}-${timestamp}-${random}`;
};

// Static method to get low stock items
itemSchema.statics.getLowStockItems = function () {
  return this.find({
    isActive: true,
    stockStatus: { $in: ["low_stock", "out_of_stock"] },
  })
    .populate("category")
    .sort({ stockQuantity: 1 });
};

// Static method to get items by category
itemSchema.statics.getByCategory = function (categoryId, activeOnly = true) {
  const query = { category: categoryId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ name: 1 });
};

// Static method for inventory valuation
itemSchema.statics.getTotalInventoryValue = async function () {
  const items = await this.find({ isActive: true });
  return items.reduce((total, item) => {
    return total + item.costPrice * item.stockQuantity;
  }, 0);
};

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
