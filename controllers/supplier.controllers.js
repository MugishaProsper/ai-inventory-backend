import Supplier from "../models/supplier.model.js";
import Product from "../models/product.model.js";

// Get all suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      status = "",
      sortBy = "name",
      sortOrder = "asc",
      minRating = 0,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { "contact.email": { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (minRating > 0) {
      query["performance.rating"] = { $gte: parseFloat(minRating) };
    }

    const sortOptions = {};
    if (sortBy === "performance") {
      sortOptions["performance.rating"] = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "deliveryPerformance") {
      // This would need to be calculated in aggregation for accurate sorting
      sortOptions["performance.onTimeDeliveries"] =
        sortOrder === "desc" ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const suppliers = await Supplier.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Supplier.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Suppliers retrieved successfully",
      data: suppliers,
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

// Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Get products from this supplier
    const products = await Product.find({ supplier: supplierId })
      .select("name sku price quantity stockStatus")
      .limit(10);

    // Get recent performance data
    const performanceData = {
      deliveryPerformance: supplier.deliveryPerformance,
      overallScore: supplier.overallScore,
      totalProducts: await Product.countDocuments({ supplier: supplierId }),
    };

    return res.status(200).json({
      success: true,
      message: "Supplier retrieved successfully",
      data: {
        ...supplier.toObject(),
        products,
        performanceData,
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

// Create new supplier
export const createSupplier = async (req, res) => {
  try {
    const supplierData = req.body;

    // Check if supplier with same name or email exists
    const existingSupplier = await Supplier.findOne({
      $or: [
        { name: { $regex: `^${supplierData.name}$`, $options: "i" } },
        { "contact.email": supplierData.contact?.email },
      ],
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier with this name or email already exists",
      });
    }

    const supplier = new Supplier(supplierData);
    await supplier.save();

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
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

// Update supplier
export const updateSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const updates = req.body;

    // Check if new name or email conflicts with existing supplier
    if (updates.name || updates.contact?.email) {
      const conflictQuery = {
        _id: { $ne: supplierId },
      };

      const orConditions = [];
      if (updates.name) {
        orConditions.push({
          name: { $regex: `^${updates.name}$`, $options: "i" },
        });
      }
      if (updates.contact?.email) {
        orConditions.push({ "contact.email": updates.contact.email });
      }

      if (orConditions.length > 0) {
        conflictQuery.$or = orConditions;
        const existingSupplier = await Supplier.findOne(conflictQuery);

        if (existingSupplier) {
          return res.status(400).json({
            success: false,
            message: "Supplier with this name or email already exists",
          });
        }
      }
    }

    const supplier = await Supplier.findByIdAndUpdate(supplierId, updates, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
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

// Delete supplier
export const deleteSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    // Check if supplier has products
    const productCount = await Product.countDocuments({ supplier: supplierId });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. It has ${productCount} associated products. Please reassign products first.`,
      });
    }

    const supplier = await Supplier.findByIdAndDelete(supplierId);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
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

// Rate supplier
export const rateSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Update rating (simple average for now)
    const currentRating = supplier.performance.rating || 0;
    const currentCount = supplier.performance.totalOrders || 0;
    const newRating =
      (currentRating * currentCount + rating) / (currentCount + 1);

    supplier.performance.rating = newRating;
    if (comment) {
      supplier.notes = comment;
    }

    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier rated successfully",
      data: {
        newRating: newRating,
        overallScore: supplier.overallScore,
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

// Update supplier performance
export const updateSupplierPerformance = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { orderData } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    await supplier.updatePerformance(orderData);

    return res.status(200).json({
      success: true,
      message: "Supplier performance updated successfully",
      data: {
        performance: supplier.performance,
        deliveryPerformance: supplier.deliveryPerformance,
        overallScore: supplier.overallScore,
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

// Get supplier analytics
export const getSupplierAnalytics = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { period = "30d" } = req.query;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const products = await Product.find({ supplier: supplierId });

    const analytics = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
      averagePrice:
        products.length > 0
          ? products.reduce((sum, p) => sum + p.price, 0) / products.length
          : 0,
      stockStatus: {
        inStock: products.filter((p) => p.stockStatus === "in_stock").length,
        lowStock: products.filter((p) => p.stockStatus === "low_stock").length,
        outOfStock: products.filter((p) => p.stockStatus === "out_of_stock")
          .length,
      },
      performance: {
        rating: supplier.performance.rating,
        deliveryPerformance: supplier.deliveryPerformance,
        overallScore: supplier.overallScore,
        responseTime: supplier.performance.responseTime,
      },
      topProducts: products
        .sort(
          (a, b) =>
            (b.statistics?.totalSold || 0) - (a.statistics?.totalSold || 0)
        )
        .slice(0, 5)
        .map((p) => ({
          id: p._id,
          name: p.name,
          sku: p.sku,
          totalSold: p.statistics?.totalSold || 0,
          revenue: p.statistics?.totalRevenue || 0,
        })),
    };

    return res.status(200).json({
      success: true,
      message: "Supplier analytics retrieved successfully",
      data: {
        supplier: {
          id: supplier._id,
          name: supplier.name,
          code: supplier.code,
          status: supplier.status,
        },
        analytics,
        period: period,
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

// Get supplier performance leaderboard
export const getSupplierLeaderboard = async (req, res) => {
  try {
    const { limit = 10, sortBy = "overallScore" } = req.query;

    const pipeline = [
      { $match: { status: "active" } },
      {
        $addFields: {
          deliveryPerformance: {
            $cond: {
              if: { $eq: ["$performance.totalOrders", 0] },
              then: 0,
              else: {
                $multiply: [
                  {
                    $divide: [
                      "$performance.onTimeDeliveries",
                      "$performance.totalOrders",
                    ],
                  },
                  100,
                ],
              },
            },
          },
          overallScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$performance.rating", 0] }, 20] },
              {
                $multiply: [
                  {
                    $cond: {
                      if: { $eq: ["$performance.totalOrders", 0] },
                      then: 0,
                      else: {
                        $multiply: [
                          {
                            $divide: [
                              "$performance.onTimeDeliveries",
                              "$performance.totalOrders",
                            ],
                          },
                          40,
                        ],
                      },
                    },
                  },
                ],
              },
              {
                $multiply: [
                  {
                    $divide: [
                      { $ifNull: ["$performance.qualityScore", 0] },
                      100,
                    ],
                  },
                  40,
                ],
              },
            ],
          },
        },
      },
      { $sort: { [sortBy]: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: 1,
          code: 1,
          "performance.rating": 1,
          "performance.totalOrders": 1,
          "performance.qualityScore": 1,
          deliveryPerformance: 1,
          overallScore: 1,
        },
      },
    ];

    const leaderboard = await Supplier.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "Supplier leaderboard retrieved successfully",
      data: leaderboard,
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
