const { Category, AuditLog } = require('../models');
const { AppError, asyncHandler } = require('../utils/AppError');
const cloudinaryService = require('../services/cloudinary.service');

/**
 * Create new category
 */
exports.createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, parentCategory, order } = req.body;

  // Check if category name already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return next(new AppError('Category name already exists', 400));
  }

  // Handle image upload
 // Handle image upload
let image = null;

if (req.file) {
  try {
    const uploadedImage = await cloudinaryService.uploadImage(
      req.file,
      'categories'
    );

    image = {
      url: uploadedImage.url,
      publicId: uploadedImage.publicId
    };
  } catch (err) {
    return next(new AppError('Image upload failed', 500));
  }
}

  // Create category
 const category = await Category.create({
  name,
  description,
  parentCategory,
  image,
  order,
  createdBy: req.user._id
});


  // Log action
  await AuditLog.logAction({
    action: 'category.create',
    resource: 'category',
    resourceId: category._id,
    resourceModel: 'Category',
    actor: req.userId,
    description: `Created category: ${category.name}`,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.status(201).json({
    status: 'success',
    message: 'Category created successfully',
    data: {
      category
    }
  });
});

/**
 * Get all categories
 */
exports.getAllCategories = asyncHandler(async (req, res, next) => {
  const { isActive, includeSubcategories } = req.query;

  const query = {};

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  let categories;

  if (includeSubcategories === 'true') {
    categories = await Category.find(query)
      .populate('subcategories')
      .populate('createdBy', 'firstName lastName')
      .sort({ order: 1, name: 1 });
  } else {
    categories = await Category.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ order: 1, name: 1 });
  }

  res.json({
    status: 'success',
    results: categories.length,
    data: {
      categories
    }
  });
});

/**
 * Get single category by ID
 */
exports.getCategoryById = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('subcategories')
    .populate('parentCategory', 'name slug')
    .populate('createdBy', 'firstName lastName email');

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.json({
    status: 'success',
    data: {
      category
    }
  });
});

/**
 * Update category
 */
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const { name, description, parentCategory, order, isActive } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Store old values for audit
  const oldValues = category.toObject();

  // Check if new name conflicts with existing category
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return next(new AppError('Category name already exists', 400));
    }
    category.name = name;
  }

  // Handle image upload
  if (req.file) {
    // Delete old image if exists
    if (category.image && category.image.publicId) {
      await cloudinaryService.deleteImage(category.image.publicId);
    }

    const uploadedImage = await cloudinaryService.uploadImage(
      req.file,
      'categories'
    );
    category.image = {
      url: uploadedImage.url,
      publicId: uploadedImage.publicId
    };
  }

  if (description !== undefined) category.description = description;
  if (parentCategory !== undefined) category.parentCategory = parentCategory;
  if (order !== undefined) category.order = order;
  if (isActive !== undefined) category.isActive = isActive;

  category.updatedBy = req.userId;
  await category.save();

  // Log action
  await AuditLog.logAction({
    action: 'category.update',
    resource: 'category',
    resourceId: category._id,
    resourceModel: 'Category',
    actor: req.userId,
    description: `Updated category: ${category.name}`,
    changes: {
      before: oldValues,
      after: category.toObject()
    },
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Category updated successfully',
    data: {
      category
    }
  });
});

/**
 * Delete category
 */
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Check if category has items
  if (category.metadata.itemCount > 0) {
    return next(
      new AppError(
        'Cannot delete category with items. Please move or delete items first.',
        400
      )
    );
  }

  // Check if category has subcategories
  const subcategories = await Category.find({ parentCategory: category._id });
  if (subcategories.length > 0) {
    return next(
      new AppError(
        'Cannot delete category with subcategories. Please delete subcategories first.',
        400
      )
    );
  }

  // Delete image if exists
  if (category.image && category.image.publicId) {
    await cloudinaryService.deleteImage(category.image.publicId);
  }

  await category.deleteOne();

  // Log action
  await AuditLog.logAction({
    action: 'category.delete',
    resource: 'category',
    resourceId: category._id,
    resourceModel: 'Category',
    actor: req.userId,
    description: `Deleted category: ${category.name}`,
    severity: 'medium',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Category deleted successfully'
  });
});

/**
 * Get category with items
 */
exports.getCategoryWithItems = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const Item = require('../models/Item');
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [items, total] = await Promise.all([
    Item.find({ category: category._id, isActive: true })
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Item.countDocuments({ category: category._id, isActive: true })
  ]);

  res.json({
    status: 'success',
    data: {
      category,
      items: {
        results: items.length,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        data: items
      }
    }
  });
});

/**
 * Update category metadata (item count and total value)
 */
exports.updateCategoryMetadata = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  await category.updateItemCount();
  await category.updateTotalValue();

  res.json({
    status: 'success',
    message: 'Category metadata updated successfully',
    data: {
      category
    }
  });
});

/**
 * Get category statistics
 */
exports.getCategoryStats = asyncHandler(async (req, res, next) => {
  const totalCategories = await Category.countDocuments();
  const activeCategories = await Category.countDocuments({ isActive: true });
  const categoriesWithItems = await Category.countDocuments({
    'metadata.itemCount': { $gt: 0 }
  });

  const topCategories = await Category.find({ isActive: true })
    .sort({ 'metadata.itemCount': -1, 'metadata.totalValue': -1 })
    .limit(10)
    .select('name metadata');

  res.json({
    status: 'success',
    data: {
      totalCategories,
      activeCategories,
      categoriesWithItems,
      topCategories
    }
  });
});

/**
 * Reorder categories
 */
exports.reorderCategories = asyncHandler(async (req, res, next) => {
  const { categories } = req.body;

  if (!categories || !Array.isArray(categories)) {
    return next(new AppError('Categories array is required', 400));
  }

  const updatePromises = categories.map(async (cat, index) => {
    await Category.findByIdAndUpdate(cat.id, { order: index });
  });

  await Promise.all(updatePromises);

  res.json({
    status: 'success',
    message: 'Categories reordered successfully'
  });
});

module.exports = exports;