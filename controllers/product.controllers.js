import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Supplier from "../models/supplier.model.js";
import Inventory from "../models/inventory.model.js";
import StockMovement from "../models/stockMovement.model.js";
import mongoose from "mongoose";

// Get all products with advanced filtering and pagination
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      category = "",
      supplier = "",
      status = "",
      stockStatus = "",
      sortBy = "name",
      sortOrder = "asc",
      minPrice = 0,
      maxPrice = "",
      tags = "",
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    if (supplier) {
      query.supplier = new mongoose.Types.ObjectId(supplier);
    }

    if (status) {
      query.status = status;
    }

    if (minPrice > 0) {
      query.price = { $gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      query.price = query.price || {};
      query.price.$lte = parseFloat(maxPrice);
    }

    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Handle stock status filtering
    if (stockStatus) {
      switch (stockStatus) {
        case "out_of_stock":
          query.quantity = 0;
          break;
        case "low_stock":
          query.$expr = {
            $and: [
              { $gt: ["$quantity", 0] },
              { $lte: ["$quantity", "$minStock"] },
            ],
          };
          break;
        case "in_stock":
          query.$expr = {
            $and: [
              { $gt: ["$quantity", "$minStock"] },
              { $lt: ["$quantity", "$maxStock"] },
            ],
          };
          break;
        case "overstock":
          query.$expr = { $gte: ["$quantity", "$maxStock"] };
          break;
      }
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy === "stockStatus") {
      // Custom sorting for stock status would need aggregation
      sortOptions.quantity = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "profitMargin") {
      // This would need aggregation for accurate sorting
      sortOptions.price = sortOrder === "desc" ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const products = await Product.find(query)
      .populate("category", "name color")
      .populate("supplier", "name code")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user's products with enhanced features
export const getMyProducts = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      page = 1,
      limit = 20,
      search = "",
      category = "",
      supplier = "",
      status = "active",
      stockStatus = "",
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { user: new mongoose.Types.ObjectId(userId) };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    if (supplier) {
      query.supplier = new mongoose.Types.ObjectId(supplier);
    }

    if (status) {
      query.status = status;
    }

    // Handle stock status filtering
    if (stockStatus) {
      switch (stockStatus) {
        case "out_of_stock":
          query.quantity = 0;
          break;
        case "low_stock":
          query.$expr = {
            $and: [
              { $gt: ["$quantity", 0] },
              { $lte: ["$quantity", "$minStock"] },
            ],
          };
          break;
        case "in_stock":
          query.$expr = {
            $and: [
              { $gt: ["$quantity", "$minStock"] },
              { $lt: ["$quantity", "$maxStock"] },
            ],
          };
          break;
        case "overstock":
          query.$expr = { $gte: ["$quantity", "$maxStock"] };
          break;
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Product.find(query)
      .populate("category", "name color icon")
      .populate("supplier", "name code contact.email")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    // Get summary statistics
    const summary = await Product.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
          outOfStock: {
            $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] },
          },
          lowStock: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", "$minStock"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Your products retrieved successfully",
      data: products,
      summary: summary[0] || {
        totalProducts: 0,
        totalValue: 0,
        outOfStock: 0,
        lowStock: 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const { id: userId } = req.user;

    const product = await Product.findOne({ _id: productId, user: userId })
      .populate("category", "name color icon description")
      .populate("supplier", "name code contact address performance");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Get recent stock movements
    const recentMovements = await StockMovement.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: {
        ...product.toObject(),
        recentMovements,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create new product with enhanced validation
export const createProduct = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      name,
      sku,
      description,
      price,
      cost,
      quantity = 0,
      minStock = 10,
      maxStock = 1000,
      category,
      supplier,
      location = "Warehouse A",
      images = [],
      tags = [],
    } = req.body;

    // Validate required fields
    if (!name || !price || !cost || !category || !supplier) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, price, cost, category, supplier",
      });
    }

    // Check if SKU already exists for this user
    if (sku) {
      const existingProduct = await Product.findOne({ sku, user: userId });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product with this SKU already exists",
        });
      }
    }

    // Validate category and supplier exist
    const [categoryExists, supplierExists] = await Promise.all([
      Category.findById(category),
      Supplier.findById(supplier),
    ]);

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (!supplierExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const product = new Product({
      user: userId,
      name,
      sku,
      description,
      price: parseFloat(price),
      cost: parseFloat(cost),
      quantity: parseInt(quantity),
      minStock: parseInt(minStock),
      maxStock: parseInt(maxStock),
      category,
      supplier,
      location,
      images,
      tags,
    });

    await product.save();

    // Add to user's inventory if quantity > 0
    if (quantity > 0) {
      let inventory = await Inventory.findOne({ user: userId });
      if (!inventory) {
        inventory = new Inventory({
          user: userId,
          name: "Main Inventory",
          products: [],
        });
      }

      await inventory.addProduct(product._id, quantity, location);

      // Create stock movement record
      const stockMovement = new StockMovement({
        product: product._id,
        user: userId,
        type: "in",
        quantity: quantity,
        previousQuantity: 0,
        newQuantity: quantity,
        unitCost: cost,
        reason: "Initial stock",
        supplier: supplier,
      });
      await stockMovement.save();
    }

    // Populate the response
    await product.populate("category", "name color");
    await product.populate("supplier", "name code");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { productId } = req.params;
    const updates = req.body;

    // Check if product exists and belongs to user
    const existingProduct = await Product.findOne({
      _id: productId,
      user: userId,
    });
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check SKU uniqueness if being updated
    if (updates.sku && updates.sku !== existingProduct.sku) {
      const duplicateSku = await Product.findOne({
        sku: updates.sku,
        user: userId,
        _id: { $ne: productId },
      });
      if (duplicateSku) {
        return res.status(400).json({
          success: false,
          message: "Product with this SKU already exists",
        });
      }
    }

    // Validate category and supplier if being updated
    if (updates.category) {
      const categoryExists = await Category.findById(updates.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
    }

    if (updates.supplier) {
      const supplierExists = await Supplier.findById(updates.supplier);
      if (!supplierExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid supplier ID",
        });
      }
    }

    // Handle quantity updates with stock movement tracking
    if (
      updates.quantity !== undefined &&
      updates.quantity !== existingProduct.quantity
    ) {
      const quantityDiff = updates.quantity - existingProduct.quantity;
      const movementType = quantityDiff > 0 ? "in" : "out";

      // Create stock movement record
      const stockMovement = new StockMovement({
        product: productId,
        user: userId,
        type: movementType === "in" ? "adjustment" : "adjustment",
        quantity: Math.abs(quantityDiff),
        previousQuantity: existingProduct.quantity,
        newQuantity: updates.quantity,
        unitCost: updates.cost || existingProduct.cost,
        reason: "Manual adjustment",
        supplier: updates.supplier || existingProduct.supplier,
      });
      await stockMovement.save();

      // Update inventory
      const inventory = await Inventory.findOne({ user: userId });
      if (inventory) {
        if (quantityDiff > 0) {
          await inventory.addProduct(productId, quantityDiff);
        } else {
          await inventory.removeProduct(productId, Math.abs(quantityDiff));
        }
      }
    }

    const product = await Product.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name color icon")
      .populate("supplier", "name code contact");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { productId } = req.params;

    const product = await Product.findOne({ _id: productId, user: userId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Remove from inventory
    const inventory = await Inventory.findOne({ user: userId });
    if (inventory) {
      const productIndex = inventory.products.findIndex(
        (p) => p.product.toString() === productId
      );
      if (productIndex > -1) {
        inventory.products.splice(productIndex, 1);
        await inventory.save();
      }
    }

    // Delete the product
    await Product.findByIdAndDelete(productId);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update product stock
export const updateProductStock = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { productId } = req.params;
    const {
      quantity,
      operation = "set",
      reason = "",
      reference = "",
    } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const product = await Product.findOne({ _id: productId, user: userId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const previousQuantity = product.quantity;
    await product.updateStock(quantity, operation);

    // Create stock movement record
    const stockMovement = new StockMovement({
      product: productId,
      user: userId,
      type:
        operation === "add"
          ? "in"
          : operation === "subtract"
            ? "out"
            : "adjustment",
      quantity: quantity,
      previousQuantity: previousQuantity,
      newQuantity: product.quantity,
      unitCost: product.cost,
      reason: reason || `Stock ${operation}`,
      reference: reference,
      supplier: product.supplier,
    });
    await stockMovement.save();

    // Update inventory
    const inventory = await Inventory.findOne({ user: userId });
    if (inventory) {
      const inventoryProduct = inventory.products.find(
        (p) => p.product.toString() === productId
      );
      if (inventoryProduct) {
        inventoryProduct.quantity = product.quantity;
        inventoryProduct.availableQuantity =
          product.quantity - inventoryProduct.reservedQuantity;
        await inventory.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      data: {
        previousQuantity,
        newQuantity: product.quantity,
        operation,
        stockStatus: product.stockStatus,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Rate product
export const rateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.rateProduct(rating);

    return res.status(200).json({
      success: true,
      message: "Product rated successfully",
      data: {
        newRating: product.statistics.avgRating,
        totalRatings: product.statistics.totalRatingCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get products that need reorder
export const getProductsNeedingReorder = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const products = await Product.find({
      user: userId,
      status: "active",
      $expr: { $lte: ["$quantity", "$minStock"] },
    })
      .populate("category", "name color")
      .populate("supplier", "name code contact")
      .sort({ quantity: 1 });

    const reorderSuggestions = products.map((product) => ({
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        currentStock: product.quantity,
        minStock: product.minStock,
        maxStock: product.maxStock,
        price: product.price,
        cost: product.cost,
      },
      category: product.category,
      supplier: product.supplier,
      suggestedQuantity: Math.max(
        product.maxStock - product.quantity,
        product.minStock * 2
      ),
      urgency:
        product.quantity === 0
          ? "critical"
          : product.quantity <= product.minStock * 0.5
            ? "high"
            : "medium",
      estimatedCost: (product.maxStock - product.quantity) * product.cost,
    }));

    return res.status(200).json({
      success: true,
      message: "Products needing reorder retrieved successfully",
      data: reorderSuggestions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Bulk update products
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required",
      });
    }

    const result = await Product.updateMany(
      {
        _id: { $in: productIds },
        user: userId,
      },
      updates,
      { runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
