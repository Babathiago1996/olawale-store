"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  X,
  Loader2,
  FolderKanban,
  Upload,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesAPI } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";

export function EditCategoryModal({ isOpen, category, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(
    category?.image?.url || null,
  );
  const [newImageFile, setNewImageFile] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      parentCategory: null,
      order: 0,
      isActive: true,
    },
  });

  // Initialize form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name || "",
        description: category.description || "",
        parentCategory: category.parentCategory?._id || null,
        order: category.order ?? 0,
        isActive: category.isActive ?? true,
      });
      setImagePreview(category.image?.url || null);
      setRemoveExistingImage(false);
      setNewImageFile(null);
    }
  }, [category, reset]);

  // Fetch categories for parent selection
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      // Filter out current category to prevent self-parenting
      const filtered =
        response.data.data.categories?.filter(
          (cat) => cat._id !== category?._id,
        ) || [];
      setCategories(filtered);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Handle new image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Image size must be less than 3MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      setNewImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setRemoveExistingImage(false);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    if (newImageFile) {
      // Remove newly selected image
      URL.revokeObjectURL(imagePreview);
      setNewImageFile(null);
      setImagePreview(category?.image?.url || null);
    } else if (category?.image?.url) {
      // Mark existing image for removal
      setRemoveExistingImage(true);
      setImagePreview(null);
    }
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (newImageFile && imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [newImageFile, imagePreview]);

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const formData = new FormData();

      // Add all form fields
      formData.append("name", data.name.trim());

      if (data.description?.trim()) {
        formData.append("description", data.description.trim());
      }

      // FIXED: Properly handle parentCategory - only add if it's a valid value
      if (
        data.parentCategory &&
        data.parentCategory !== "none" &&
        data.parentCategory !== ""
      ) {
        formData.append("parentCategory", data.parentCategory);
      }
      // If parentCategory is null/empty, don't add it to formData at all
      // The backend should handle this as removing the parent

      formData.append("order", data.order.toString());
      formData.append("isActive", data.isActive.toString());

      // Handle image update
      if (newImageFile) {
        // New image selected - backend will handle old image deletion
        formData.append("image", newImageFile);
      } else if (removeExistingImage) {
        // Signal to remove existing image
        formData.append("removeImage", "true");
      }

      await categoriesAPI.update(category._id, formData);

      toast.success("Category updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update category";
      toast.error(errorMessage);
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setImagePreview(null);
      setNewImageFile(null);
      setRemoveExistingImage(false);
      onClose();
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-background w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Edit Category</h2>
              <p className="text-sm text-muted-foreground">
                Update category information
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {/* Category Info Banner */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Category ID</p>
                <p className="font-mono text-xs">{category._id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Slug</p>
                <p className="font-mono text-xs">/{category.slug}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Items Count</p>
                <p className="font-semibold">
                  {category.metadata?.itemCount || 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="text-xs">
                  {new Date(category.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Category Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Electronics, Furniture"
              {...register("name", {
                required: "Category name is required",
                maxLength: {
                  value: 100,
                  message: "Name cannot exceed 100 characters",
                },
                validate: {
                  noLeadingTrailingSpace: (value) =>
                    value.trim() === value || "Remove leading/trailing spaces",
                  notEmpty: (value) =>
                    value.trim().length > 0 || "Name cannot be empty",
                },
              })}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.name.message}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Provide additional details..."
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "Description cannot exceed 500 characters",
                },
              })}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.description.message}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {watch("description")?.length || 0}/500 characters
            </p>
          </div>

          {/* Parent Category - FIXED */}
          <div className="space-y-2">
            <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
            <Controller
              name="parentCategory"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    // Convert 'none' to null for proper handling
                    field.onChange(value === "none" ? null : value);
                  }}
                  value={field.value || "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top-level)</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {watch("parentCategory")
                ? "This category will be a subcategory"
                : "This will be a top-level category"}
            </p>
          </div>

          {/* Image Upload/Update */}
          <div className="space-y-3">
            <Label>Category Image</Label>

            <div className="border-2 border-dashed rounded-lg overflow-hidden">
              {imagePreview && !removeExistingImage ? (
                <div className="relative">
                  <div className="relative h-48 w-full">
                    <Image
                      src={imagePreview}
                      alt="Category preview"
                      fill
                      className="object-contain bg-muted"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                  <div className="absolute bottom-2 left-2">
                    <label className="cursor-pointer">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        asChild
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-1" />
                          Change Image
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-muted/50 transition group">
                  <Upload className="w-10 h-10 text-muted-foreground mb-3 group-hover:text-primary transition" />
                  <p className="text-sm font-medium mb-1">
                    {category.image?.url
                      ? "Upload new image"
                      : "Click to upload image"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP up to 3MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Grid: Order + Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min="0"
                {...register("order", {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Order must be 0 or greater",
                  },
                })}
                className={errors.order ? "border-destructive" : ""}
              />
              {errors.order && (
                <p className="text-xs text-destructive">
                  {errors.order.message}
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center justify-between h-10 px-4 border rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {watch("isActive") ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {watch("isActive") ? "Visible" : "Hidden"}
                  </span>
                </div>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
