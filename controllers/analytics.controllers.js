import Product from "../models/product.model.js";
import Inventory from "../models/inventory.model.js";
import StockMovement from "../models/stockMovement.model.js";
import Supplier from "../models/supplier.model.js";
import mongoose from "mongoose";

// Get dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { period = "30d" } = req.query;

    const days = parseInt(period.replace("d", ""));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's inventory
    const inventory = await Inventory.findOne({ user: userId }).populate(
      "products.product"
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    // Calculate basic statistics
    const totalProducts = inventory.products.length;
    const totalValue = inventory.statistics.totalValue;
    const lowStockItems = inventory.statistics.lowStockItems;
    const outOfStockItems = inventory.statistics.outOfStockItems;

    // Get products for revenue calculation
    const products = await Product.find({ user: userId });
    const monthlyRevenue = products.reduce((sum, product) => {
      return sum + (product.statistics?.totalRevenue || 0);
    }, 0);

    // Calculate revenue change (mock calculation for now)
    const previousRevenue = monthlyRevenue * 0.85; // Simulate 15% growth
    const monthlyRevenueChange =
      ((monthlyRevenue - previousRevenue) / previousRevenue) * 100;

    // Get top selling products
    const topSellingProducts = products
      .sort(
        (a, b) =>
          (b.statistics?.totalSold || 0) - (a.statistics?.totalSold || 0)
      )
      .slice(0, 5)
      .map((product) => ({
        id: product._id,
        name: product.name,
        sku: product.sku,
        totalSold: product.statistics?.totalSold || 0,
        revenue: product.statistics?.totalRevenue || 0,
        image: product.images?.[0] || null,
      }));

    // Get recent alerts
    const recentAlerts = inventory.alerts
      .filter((alert) => !alert.isRead)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((alert) => ({
        id: alert._id,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        createdAt: alert.createdAt,
      }));

    // Get stock movements for trend analysis
    const stockMovements = await StockMovement.getMovementsByDateRange(
      startDate.toISOString(),
      new Date().toISOString(),
      { user: new mongoose.Types.ObjectId(userId) }
    );

    // Calculate daily revenue trend (simplified)
    const dailyRevenue = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate revenue data (in real app, this would come from sales/orders)
      const revenue = Math.random() * 1000 + 500;
      dailyRevenue.push({
        date: date.toISOString().split("T")[0],
        value: Math.round(revenue * 100) / 100,
      });
    }

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$category",
          name: {
            $first: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
          },
          color: {
            $first: { $ifNull: ["$categoryInfo.color", "bg-gray-500"] },
          },
          count: { $sum: 1 },
          value: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const dashboardData = {
      summary: {
        totalProducts,
        totalValue: Math.round(totalValue * 100) / 100,
        lowStockItems,
        outOfStockItems,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        monthlyRevenueChange: Math.round(monthlyRevenueChange * 100) / 100,
      },
      charts: {
        dailyRevenue,
        categoryDistribution: categoryDistribution.map((cat) => ({
          id: cat._id,
          name: cat.name,
          color: cat.color,
          count: cat.count,
          value: Math.round(cat.value * 100) / 100,
          percentage:
            totalProducts > 0
              ? Math.round((cat.count / totalProducts) * 100)
              : 0,
        })),
      },
      topSellingProducts,
      recentAlerts,
      period,
    };

    return res.status(200).json({
      success: true,
      message: "Dashboard analytics retrieved successfully",
      data: dashboardData,
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

// Get inventory analytics
export const getInventoryAnalytics = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { period = "30d", categoryId, supplierId } = req.query;

    const days = parseInt(period.replace("d", ""));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build product filter
    const productFilter = { user: new mongoose.Types.ObjectId(userId) };
    if (categoryId) {
      productFilter.category = new mongoose.Types.ObjectId(categoryId);
    }
    if (supplierId) {
      productFilter.supplier = new mongoose.Types.ObjectId(supplierId);
    }

    // Get stock movement analytics
    const movementAnalytics = await StockMovement.getAnalytics(userId, period);

    // Get inventory turnover data
    const turnoverData = await Product.aggregate([
      { $match: productFilter },
      {
        $addFields: {
          turnoverRate: {
            $cond: {
              if: { $eq: ["$quantity", 0] },
              then: 0,
              else: {
                $divide: [
                  { $ifNull: ["$statistics.totalSold", 0] },
                  "$quantity",
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTurnover: { $avg: "$turnoverRate" },
          totalProducts: { $sum: 1 },
          fastMoving: {
            $sum: {
              $cond: [{ $gte: ["$turnoverRate", 2] }, 1, 0],
            },
          },
          slowMoving: {
            $sum: {
              $cond: [{ $lte: ["$turnoverRate", 0.5] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get stock status distribution
    const stockStatusData = await Product.aggregate([
      { $match: productFilter },
      {
        $addFields: {
          stockStatus: {
            $switch: {
              branches: [
                { case: { $eq: ["$quantity", 0] }, then: "out_of_stock" },
                {
                  case: { $lte: ["$quantity", "$minStock"] },
                  then: "low_stock",
                },
                {
                  case: { $gte: ["$quantity", "$maxStock"] },
                  then: "overstock",
                },
              ],
              default: "in_stock",
            },
          },
        },
      },
      {
        $group: {
          _id: "$stockStatus",
          count: { $sum: 1 },
          value: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
    ]);

    // Get ABC analysis (based on value)
    const abcAnalysis = await Product.aggregate([
      { $match: productFilter },
      {
        $addFields: {
          totalValue: { $multiply: ["$price", "$quantity"] },
        },
      },
      { $sort: { totalValue: -1 } },
      {
        $group: {
          _id: null,
          products: { $push: "$$ROOT" },
          totalValue: { $sum: "$totalValue" },
        },
      },
      {
        $addFields: {
          products: {
            $map: {
              input: { $range: [0, { $size: "$products" }] },
              as: "index",
              in: {
                $mergeObjects: [
                  { $arrayElemAt: ["$products", "$$index"] },
                  {
                    cumulativeValue: {
                      $sum: {
                        $slice: [
                          "$products.totalValue",
                          0,
                          { $add: ["$$index", 1] },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "product",
              in: {
                $mergeObjects: [
                  "$$product",
                  {
                    cumulativePercent: {
                      $multiply: [
                        {
                          $divide: ["$$product.cumulativeValue", "$totalValue"],
                        },
                        100,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          abcCategories: {
            A: {
              $size: {
                $filter: {
                  input: "$products",
                  cond: { $lte: ["$$this.cumulativePercent", 80] },
                },
              },
            },
            B: {
              $size: {
                $filter: {
                  input: "$products",
                  cond: {
                    $and: [
                      { $gt: ["$$this.cumulativePercent", 80] },
                      { $lte: ["$$this.cumulativePercent", 95] },
                    ],
                  },
                },
              },
            },
            C: {
              $size: {
                $filter: {
                  input: "$products",
                  cond: { $gt: ["$$this.cumulativePercent", 95] },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          abcCategories: 1,
          totalValue: 1,
        },
      },
    ]);

    const analyticsData = {
      movementAnalytics: movementAnalytics,
      turnoverData: turnoverData[0] || {
        avgTurnover: 0,
        totalProducts: 0,
        fastMoving: 0,
        slowMoving: 0,
      },
      stockStatusDistribution: stockStatusData.reduce((acc, status) => {
        acc[status._id] = {
          count: status.count,
          value: Math.round(status.value * 100) / 100,
        };
        return acc;
      }, {}),
      abcAnalysis: abcAnalysis[0] || {
        abcCategories: { A: 0, B: 0, C: 0 },
        totalValue: 0,
      },
      period,
    };

    return res.status(200).json({
      success: true,
      message: "Inventory analytics retrieved successfully",
      data: analyticsData,
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

// Get sales analytics
export const getSalesAnalytics = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { period = "30d", groupBy = "day" } = req.query;

    const days = parseInt(period.replace("d", ""));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get products with sales data
    const products = await Product.find({ user: userId })
      .populate("category", "name color")
      .populate("supplier", "name");

    // Calculate total sales metrics
    const totalRevenue = products.reduce(
      (sum, p) => sum + (p.statistics?.totalRevenue || 0),
      0
    );
    const totalSold = products.reduce(
      (sum, p) => sum + (p.statistics?.totalSold || 0),
      0
    );
    const totalProfit = products.reduce((sum, p) => {
      const revenue = p.statistics?.totalRevenue || 0;
      const cost = (p.statistics?.totalSold || 0) * p.cost;
      return sum + (revenue - cost);
    }, 0);

    // Generate time series data (simulated for demo)
    const timeSeriesData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate sales data
      const revenue = Math.random() * 1000 + 200;
      const orders = Math.floor(Math.random() * 20) + 5;

      timeSeriesData.push({
        date: date.toISOString().split("T")[0],
        revenue: Math.round(revenue * 100) / 100,
        orders: orders,
        averageOrderValue: Math.round((revenue / orders) * 100) / 100,
      });
    }

    // Top products by revenue
    const topProductsByRevenue = products
      .sort(
        (a, b) =>
          (b.statistics?.totalRevenue || 0) - (a.statistics?.totalRevenue || 0)
      )
      .slice(0, 10)
      .map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        revenue: p.statistics?.totalRevenue || 0,
        quantity: p.statistics?.totalSold || 0,
        category: p.category?.name || "Uncategorized",
        profit:
          (p.statistics?.totalRevenue || 0) -
          (p.statistics?.totalSold || 0) * p.cost,
      }));

    // Category performance
    const categoryPerformance = await Product.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$category",
          name: {
            $first: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
          },
          color: {
            $first: { $ifNull: ["$categoryInfo.color", "bg-gray-500"] },
          },
          revenue: { $sum: { $ifNull: ["$statistics.totalRevenue", 0] } },
          quantity: { $sum: { $ifNull: ["$statistics.totalSold", 0] } },
          products: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const salesAnalytics = {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalSold,
        totalProfit: Math.round(totalProfit * 100) / 100,
        averageOrderValue:
          totalSold > 0
            ? Math.round((totalRevenue / totalSold) * 100) / 100
            : 0,
        profitMargin:
          totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
      },
      timeSeriesData,
      topProductsByRevenue,
      categoryPerformance: categoryPerformance.map((cat) => ({
        ...cat,
        revenue: Math.round(cat.revenue * 100) / 100,
        averageRevenuePerProduct:
          cat.products > 0
            ? Math.round((cat.revenue / cat.products) * 100) / 100
            : 0,
      })),
      period,
    };

    return res.status(200).json({
      success: true,
      message: "Sales analytics retrieved successfully",
      data: salesAnalytics,
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

// Get supplier performance analytics
export const getSupplierPerformanceAnalytics = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { period = "30d" } = req.query;

    // Get all suppliers with their products
    const supplierPerformance = await Supplier.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "supplier",
          as: "products",
        },
      },
      {
        $match: {
          "products.user": new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $addFields: {
          totalProducts: { $size: "$products" },
          totalValue: {
            $sum: {
              $map: {
                input: "$products",
                as: "product",
                in: { $multiply: ["$$product.price", "$$product.quantity"] },
              },
            },
          },
          averageRating: "$performance.rating",
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
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          status: 1,
          totalProducts: 1,
          totalValue: 1,
          averageRating: 1,
          deliveryPerformance: 1,
          "performance.qualityScore": 1,
          "performance.responseTime": 1,
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Supplier performance analytics retrieved successfully",
      data: {
        supplierPerformance: supplierPerformance.map((supplier) => ({
          ...supplier,
          totalValue: Math.round(supplier.totalValue * 100) / 100,
        })),
        period,
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
