const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    image: {
      url: String,
      publicId: String,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    metadata: {
      itemCount: {
        type: Number,
        default: 0,
      },
      totalValue: {
        type: Number,
        default: 0,
      },
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

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ createdAt: -1 });

// Virtual for subcategories
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory",
});

// Pre-save middleware to generate slug
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

// Method to update item count
categorySchema.methods.updateItemCount = async function () {
  const Item = mongoose.model("Item");
  const count = await Item.countDocuments({
    category: this._id,
    isActive: true,
  });
  this.metadata.itemCount = count;
  return await this.save();
};

// Method to update total value
categorySchema.methods.updateTotalValue = async function () {
  const Item = mongoose.model("Item");
  const items = await Item.find({ category: this._id, isActive: true });
  const totalValue = items.reduce((sum, item) => {
    return sum + item.costPrice * item.stockQuantity;
  }, 0);
  this.metadata.totalValue = totalValue;
  return await this.save();
};

// Static method to get active categories with items
categorySchema.statics.getActiveWithItems = function () {
  return this.find({ isActive: true })
    .populate("subcategories")
    .sort({ order: 1, name: 1 });
};

module.exports =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
