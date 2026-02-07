const { Item, Category, AuditLog } = require("../models");
const { AppError, asyncHandler } = require("../utils/AppError");
const cloudinaryService = require("../services/cloudinary.service");

/**
 * Create new item
 */
exports.createItem = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    category,
    costPrice,
    sellingPrice,
    stockQuantity,
    lowStockThreshold,
    unit,
    barcode,
    tags,
    weight,
    dimensions,
  } = req.body;

  // Validate category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new AppError("Category not found", 404));
  }

  // Generate SKU
  const sku = await Item.generateSKU(categoryExists.name.toUpperCase());

  // Handle image uploads
  let images = [];
  if (req.files && req.files.length > 0) {
    const uploadedImages = await cloudinaryService.uploadMultipleImages(
      req.files,
      "items",
    );

    images = uploadedImages.map((img, index) => ({
      url: img.url,
      publicId: img.publicId,
      isPrimary: index === 0,
      order: index,
    }));
  }

  // Create item
  const item = await Item.create({
    name,
    description,
    sku,
    barcode,
    category,
    images,
    costPrice,
    sellingPrice,
    stockQuantity,
    lowStockThreshold,
    unit,
    tags,
    weight,
    dimensions,
    createdBy: req.userId,
  });

  // Update category metadata
  await categoryExists.updateItemCount();
  await categoryExists.updateTotalValue();

  // Log action
  await AuditLog.logAction({
    action: "item.create",
    resource: "item",
    resourceId: item._id,
    resourceModel: "Item",
    actor: req.userId,
    description: `Created item: ${item.name} (${item.sku})`,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  res.status(201).json({
    status: "success",
    message: "Item created successfully",
    data: {
      item,
    },
  });
});

/**
 * Get all items with filtering, pagination, and search
 */

exports.getAllItems = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    stockStatus,
    sortBy = "createdAt",
    order = "desc",
    minPrice,
    maxPrice,
    isActive, // ← This can still be passed to override
  } = req.query;

  // Build query
  const query = {};

  // ✅ FIX: Default to showing only active items unless explicitly requested otherwise
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  } else {
    // ✅ DEFAULT: Only show active items
    query.isActive = true;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (stockStatus) {
    query.stockStatus = stockStatus;
  }

  if (minPrice || maxPrice) {
    query.sellingPrice = {};
    if (minPrice) query.sellingPrice.$gte = Number(minPrice);
    if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
  }

  // Build sort
  const sort = {};
  sort[sortBy] = order === "asc" ? 1 : -1;

  // Execute query with pagination
  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Item.find(query)
      .populate("category", "name slug")
      .populate("createdBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Item.countDocuments(query),
  ]);

  res.json({
    status: "success",
    results: items.length,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
    data: {
      items,
    },
  });
});

/**
 * Get single item by ID
 */
exports.getItemById = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id)
    .populate("category", "name slug description")
    .populate("createdBy", "firstName lastName email")
    .populate("restockHistory.restockedBy", "firstName lastName");

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  // Increment view count
  item.metadata.views += 1;
  await item.save();

  res.json({
    status: "success",
    data: {
      item,
    },
  });
});

/**
 * Update item
 */
exports.updateItem = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    category,
    costPrice,
    sellingPrice,
    lowStockThreshold,
    unit,
    barcode,
    tags,
    weight,
    dimensions,
    isActive,
    isFeatured,
  } = req.body;

  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  // Store old values for audit
  const oldValues = item.toObject();

  // Validate category if changed
  if (category && category !== item.category.toString()) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new AppError("Category not found", 404));
    }
    item.category = category;
  }

  // Update fields
  if (name) item.name = name;
  if (description !== undefined) item.description = description;
  if (costPrice !== undefined) item.costPrice = costPrice;
  if (sellingPrice !== undefined) item.sellingPrice = sellingPrice;
  if (lowStockThreshold !== undefined)
    item.lowStockThreshold = lowStockThreshold;
  if (unit) item.unit = unit;
  if (barcode !== undefined) item.barcode = barcode;
  if (tags) item.tags = tags;
  if (weight) item.weight = weight;
  if (dimensions) item.dimensions = dimensions;
  if (isActive !== undefined) item.isActive = isActive;
  if (isFeatured !== undefined) item.isFeatured = isFeatured;

  item.updatedBy = req.userId;
  await item.save();

  // Log action
  await AuditLog.logAction({
    action: "item.update",
    resource: "item",
    resourceId: item._id,
    resourceModel: "Item",
    actor: req.userId,
    description: `Updated item: ${item.name} (${item.sku})`,
    changes: {
      before: oldValues,
      after: item.toObject(),
    },
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  res.json({
    status: "success",
    message: "Item updated successfully",
    data: {
      item,
    },
  });
});

/**
 * Delete item (soft delete)
 */
exports.deleteItem = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  // Soft delete
  item.isActive = false;
  item.updatedBy = req.userId;
  await item.save();

  // Log action
  await AuditLog.logAction({
    action: "item.delete",
    resource: "item",
    resourceId: item._id,
    resourceModel: "Item",
    actor: req.userId,
    description: `Deleted item: ${item.name} (${item.sku})`,
    severity: "medium",
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  res.json({
    status: "success",
    message: "Item deleted successfully",
  });
});

/**
 * Add images to item
 */
exports.addImages = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError("No images provided", 400));
  }

  // Upload images
  const uploadedImages = await cloudinaryService.uploadMultipleImages(
    req.files,
    "items",
  );

  // Add to item
  const newImages = uploadedImages.map((img, index) => ({
    url: img.url,
    publicId: img.publicId,
    isPrimary: false,
    order: item.images.length + index,
  }));

  item.images.push(...newImages);
  item.updatedBy = req.userId;
  await item.save();

  res.json({
    status: "success",
    message: "Images added successfully",
    data: {
      item,
    },
  });
});

/**
 * Remove image from item
 */
exports.removeImage = asyncHandler(async (req, res, next) => {
  const { imageId } = req.params;

  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  const image = item.images.id(imageId);

  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  // Delete from Cloudinary
  await cloudinaryService.deleteImage(image.publicId);

  // Remove from item
  item.images.pull(imageId);
  item.updatedBy = req.userId;
  await item.save();

  res.json({
    status: "success",
    message: "Image removed successfully",
    data: {
      item,
    },
  });
});

/**
 * Set primary image
 */
exports.setPrimaryImage = asyncHandler(async (req, res, next) => {
  const { imageId } = req.params;

  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  await item.setPrimaryImage(imageId);

  res.json({
    status: "success",
    message: "Primary image set successfully",
    data: {
      item,
    },
  });
});

/**
 * Restock item
 */
/**
 * Restock item
 */
exports.restockItem = asyncHandler(async (req, res, next) => {
  // ✅ FIXED: Force to numbers to prevent string bugs
  const quantity = Number(req.body.quantity);
  const costPrice = Number(req.body.costPrice);
  const { supplier, reference, notes } = req.body;

  // ✅ FIXED: Proper validation
  if (!quantity || quantity <= 0 || isNaN(quantity)) {
    return next(new AppError("Valid quantity is required", 400));
  }

  if (costPrice !== undefined && (costPrice < 0 || isNaN(costPrice))) {
    return next(
      new AppError("Cost price must be a valid positive number", 400),
    );
  }

  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  console.log(
    `📦 Restocking ${item.name}: +${quantity} units (Current: ${item.stockQuantity})`,
  );

  // Add restock
  await item.addRestock(quantity, costPrice, req.userId, {
    supplier,
    reference,
    notes,
  });

  console.log(
    `✅ Restock complete: ${item.name} now has ${item.stockQuantity} units (Status: ${item.stockStatus})`,
  );

  // Log action
  await AuditLog.logAction({
    action: "item.restock",
    resource: "item",
    resourceId: item._id,
    resourceModel: "Item",
    actor: req.userId,
    description: `Restocked ${quantity} units of ${item.name}`,
    metadata: {
      quantity,
      costPrice,
      supplier,
      newStockLevel: item.stockQuantity,
      stockStatus: item.stockStatus,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  res.json({
    status: "success",
    message: "Item restocked successfully",
    data: {
      item,
    },
  });
});
/**
 * Get low stock items
 */
exports.getLowStockItems = asyncHandler(async (req, res, next) => {
  const items = await Item.getLowStockItems();

  res.json({
    status: "success",
    results: items.length,
    data: {
      items,
    },
  });
});

/**
 * Get inventory statistics
 */
exports.getInventoryStats = asyncHandler(async (req, res, next) => {
  const [
    totalItems,
    activeItems,
    totalValue,
    lowStockCount,
    outOfStockCount,
    categoryBreakdown,
  ] = await Promise.all([
    Item.countDocuments(),
    Item.countDocuments({ isActive: true }),
    Item.getTotalInventoryValue(),
    Item.countDocuments({ stockStatus: "low_stock", isActive: true }),
    Item.countDocuments({ stockStatus: "out_of_stock", isActive: true }),
    Item.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$costPrice", "$stockQuantity"] } },
          totalStock: { $sum: "$stockQuantity" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          categoryName: "$category.name",
          count: 1,
          totalValue: 1,
          totalStock: 1,
        },
      },
    ]),
  ]);

  res.json({
    status: "success",
    data: {
      totalItems,
      activeItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
      categoryBreakdown,
    },
  });
});

/**
 * Search items
 */
exports.searchItems = asyncHandler(async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return next(new AppError("Search query is required", 400));
  }

  const items = await Item.find({
    isActive: true,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { barcode: { $regex: q, $options: "i" } },
    ],
  })

    .select("name sku sellingPrice stockQuantity images category")
    .populate("category", "name")
    .limit(Number(limit));

  res.json({
    status: "success",
    results: items.length,
    data: {
      items,
    },
  });
});

module.exports = exports;
