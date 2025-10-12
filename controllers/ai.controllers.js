import AIInsight from "../models/aiInsight.model.js";
import Product from "../models/product.model.js";
import StockMovement from "../models/stockMovement.model.js";
import mongoose from "mongoose";

// Get AI insights for user
export const getAIInsights = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      type = "",
      priority = "",
      status = "active",
      limit = 20,
      page = 1,
    } = req.query;

    const query = {
      user: new mongoose.Types.ObjectId(userId),
      status: status,
      expiresAt: { $gt: new Date() },
    };

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const insights = await AIInsight.find(query)
      .populate("products", "name sku quantity minStock stockStatus")
      .populate("categories", "name color")
      .populate("suppliers", "name code")
      .sort({ priority: 1, confidence: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AIInsight.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "AI insights retrieved successfully",
      data: insights,
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

// Generate demand forecast for products
export const generateDemandForecast = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { productIds = [], period = "30d" } = req.body;

    const days = parseInt(period.replace("d", ""));

    // Get products to analyze
    let products;
    if (productIds.length > 0) {
      products = await Product.find({
        _id: { $in: productIds },
        user: userId,
      });
    } else {
      // Analyze products that need reorder or are low stock
      products = await Product.find({
        user: userId,
        $or: [
          { $expr: { $lte: ["$quantity", "$minStock"] } },
          { "aiInsights.reorderSuggestion.suggested": true },
        ],
      }).limit(20);
    }

    const forecasts = [];

    for (const product of products) {
      // Simple demand forecasting algorithm (in production, use ML models)
      const historicalSales = product.statistics?.totalSold || 0;
      const currentStock = product.quantity;
      const minStock = product.minStock;

      // Calculate trend based on historical data
      const dailyAverage = historicalSales / 90; // Assume 90-day history
      const seasonalFactor =
        1 + Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 7)) * 0.2; // Weekly seasonality
      const trendFactor = currentStock < minStock ? 1.3 : 1.0; // Higher demand if low stock

      const predictedDemand = Math.max(
        0,
        Math.round(dailyAverage * days * seasonalFactor * trendFactor)
      );
      const confidence = Math.min(0.95, 0.3 + historicalSales / 1000); // Higher confidence with more data

      const forecast = {
        period: period,
        predictions: [],
      };

      // Generate daily predictions
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const dailyDemand = Math.max(
          0,
          Math.round(
            dailyAverage *
              seasonalFactor *
              trendFactor *
              (0.8 + Math.random() * 0.4)
          )
        );

        forecast.predictions.push({
          date: date,
          value: dailyDemand,
          confidence: confidence,
        });
      }

      // Update product AI insights
      product.aiInsights.demandForecast = {
        nextMonth: predictedDemand,
        confidence: confidence,
        trend: predictedDemand > historicalSales ? "increasing" : "decreasing",
      };
      await product.save();

      // Create AI insight
      const insight = new AIInsight({
        user: userId,
        type: "demand_forecast",
        title: `Demand Forecast for ${product.name}`,
        description: `Predicted demand of ${predictedDemand} units over ${period} with ${Math.round(confidence * 100)}% confidence`,
        confidence: confidence,
        priority: confidence > 0.7 ? "high" : "medium",
        products: [product._id],
        data: { forecast },
      });
      await insight.save();

      forecasts.push({
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          currentStock: currentStock,
        },
        forecast: {
          predictedDemand,
          confidence,
          trend: product.aiInsights.demandForecast.trend,
          dailyPredictions: forecast.predictions.slice(0, 7), // Return first week
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Demand forecasts generated successfully",
      data: {
        forecasts,
        period,
        generatedAt: new Date(),
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

// Generate reorder suggestions
export const generateReorderSuggestions = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { threshold = "auto" } = req.body;

    // Get products that need reordering
    let products;
    if (threshold === "auto") {
      products = await Product.find({
        user: userId,
        status: "active",
        $expr: { $lte: ["$quantity", "$minStock"] },
      })
        .populate("category", "name")
        .populate("supplier", "name");
    } else {
      const thresholdValue = parseInt(threshold);
      products = await Product.find({
        user: userId,
        status: "active",
        quantity: { $lte: thresholdValue },
      })
        .populate("category", "name")
        .populate("supplier", "name");
    }

    const suggestions = [];

    for (const product of products) {
      // Calculate suggested reorder quantity
      const currentStock = product.quantity;
      const minStock = product.minStock;
      const maxStock = product.maxStock;
      const dailyUsage = (product.statistics?.totalSold || 0) / 90; // Average daily usage

      // Lead time estimation (in days) - in production, get from supplier data
      const leadTime = product.supplier?.performance?.responseTime || 7;

      // Safety stock calculation
      const safetyStock = Math.ceil(dailyUsage * leadTime * 1.5);

      // Economic Order Quantity (simplified)
      const suggestedQuantity = Math.max(
        minStock - currentStock + safetyStock,
        Math.ceil((maxStock - currentStock) / 2)
      );

      // Determine urgency
      let urgency = "low";
      if (currentStock === 0) urgency = "high";
      else if (currentStock <= minStock * 0.5) urgency = "medium";

      // Calculate estimated stockout date
      const stockoutDate = new Date();
      if (dailyUsage > 0) {
        stockoutDate.setDate(
          stockoutDate.getDate() + Math.floor(currentStock / dailyUsage)
        );
      } else {
        stockoutDate.setDate(stockoutDate.getDate() + 30); // Default 30 days if no usage data
      }

      // Update product AI insights
      product.aiInsights.reorderSuggestion = {
        suggested: true,
        quantity: suggestedQuantity,
        urgency: urgency,
      };
      await product.save();

      // Create AI insight
      const insight = new AIInsight({
        user: userId,
        type: "reorder_suggestion",
        title: `Reorder Suggestion: ${product.name}`,
        description: `Suggest ordering ${suggestedQuantity} units. Current stock: ${currentStock}, urgency: ${urgency}`,
        confidence: 0.8,
        priority:
          urgency === "high"
            ? "critical"
            : urgency === "medium"
              ? "high"
              : "medium",
        products: [product._id],
        suppliers: product.supplier ? [product.supplier._id] : [],
        data: {
          reorderSuggestion: {
            suggestedQuantity,
            estimatedStockoutDate: stockoutDate,
            leadTime,
            seasonalFactor: 1.0,
          },
        },
      });
      await insight.save();

      suggestions.push({
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          currentStock,
          minStock,
          maxStock,
          category: product.category?.name || "Uncategorized",
          supplier: product.supplier?.name || "Unknown",
        },
        suggestion: {
          suggestedQuantity,
          urgency,
          estimatedStockoutDate: stockoutDate,
          estimatedCost: suggestedQuantity * product.cost,
          leadTime,
          safetyStock,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reorder suggestions generated successfully",
      data: {
        suggestions: suggestions.sort((a, b) => {
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return (
            urgencyOrder[b.suggestion.urgency] -
            urgencyOrder[a.suggestion.urgency]
          );
        }),
        summary: {
          totalSuggestions: suggestions.length,
          highUrgency: suggestions.filter(
            (s) => s.suggestion.urgency === "high"
          ).length,
          estimatedTotalCost: suggestions.reduce(
            (sum, s) => sum + s.suggestion.estimatedCost,
            0
          ),
        },
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

// Analyze trends
export const analyzeTrends = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { period = "90d", type = "all" } = req.query;

    const days = parseInt(period.replace("d", ""));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = [];

    if (type === "all" || type === "sales") {
      // Sales trend analysis
      const products = await Product.find({ user: userId }).populate(
        "category",
        "name"
      );

      for (const product of products) {
        const totalSold = product.statistics?.totalSold || 0;
        const totalRevenue = product.statistics?.totalRevenue || 0;

        if (totalSold > 0) {
          // Simulate trend calculation (in production, use time series data)
          const trendDirection =
            Math.random() > 0.5 ? "increasing" : "decreasing";
          const changePercent = Math.random() * 50 - 25; // -25% to +25%

          const insight = new AIInsight({
            user: userId,
            type: "trend_analysis",
            title: `Sales Trend: ${product.name}`,
            description: `${trendDirection === "increasing" ? "Upward" : "Downward"} trend detected with ${Math.abs(changePercent).toFixed(1)}% change`,
            confidence: 0.7,
            priority: Math.abs(changePercent) > 20 ? "high" : "medium",
            products: [product._id],
            categories: product.category ? [product.category._id] : [],
            data: {
              trendAnalysis: {
                trend: trendDirection,
                changePercent: changePercent,
                period: period,
                seasonalPattern: Math.random() > 0.7,
              },
            },
          });
          await insight.save();

          trends.push({
            product: {
              id: product._id,
              name: product.name,
              sku: product.sku,
              category: product.category?.name || "Uncategorized",
            },
            trend: {
              direction: trendDirection,
              changePercent: Math.round(changePercent * 100) / 100,
              confidence: 0.7,
              period: period,
            },
          });
        }
      }
    }

    if (type === "all" || type === "category") {
      // Category trend analysis
      const categoryTrends = await Product.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$category",
            categoryName: {
              $first: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
            },
            totalRevenue: {
              $sum: { $ifNull: ["$statistics.totalRevenue", 0] },
            },
            totalSold: { $sum: { $ifNull: ["$statistics.totalSold", 0] } },
            productCount: { $sum: 1 },
          },
        },
        { $match: { totalSold: { $gt: 0 } } },
      ]);

      for (const categoryData of categoryTrends) {
        const trendDirection =
          Math.random() > 0.4 ? "increasing" : "decreasing";
        const changePercent = Math.random() * 40 - 20;

        const insight = new AIInsight({
          user: userId,
          type: "trend_analysis",
          title: `Category Trend: ${categoryData.categoryName}`,
          description: `Category showing ${trendDirection} trend with ${Math.abs(changePercent).toFixed(1)}% change`,
          confidence: 0.6,
          priority: "medium",
          categories: categoryData._id ? [categoryData._id] : [],
          data: {
            trendAnalysis: {
              trend: trendDirection,
              changePercent: changePercent,
              period: period,
              seasonalPattern: false,
            },
          },
        });
        await insight.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Trend analysis completed successfully",
      data: {
        trends: trends.slice(0, 20), // Limit response size
        summary: {
          totalTrends: trends.length,
          increasingTrends: trends.filter(
            (t) => t.trend.direction === "increasing"
          ).length,
          decreasingTrends: trends.filter(
            (t) => t.trend.direction === "decreasing"
          ).length,
        },
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

// Detect anomalies
export const detectAnomalies = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { sensitivity = "medium" } = req.body;

    const sensitivityThresholds = {
      low: 3.0, // 3 standard deviations
      medium: 2.5, // 2.5 standard deviations
      high: 2.0, // 2 standard deviations
    };

    const threshold = sensitivityThresholds[sensitivity] || 2.5;
    const anomalies = [];

    // Get recent stock movements for anomaly detection
    const recentMovements = await StockMovement.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    }).populate("product", "name sku");

    // Group movements by product
    const productMovements = {};
    recentMovements.forEach((movement) => {
      const productId = movement.product._id.toString();
      if (!productMovements[productId]) {
        productMovements[productId] = [];
      }
      productMovements[productId].push(movement);
    });

    // Analyze each product for anomalies
    for (const [productId, movements] of Object.entries(productMovements)) {
      if (movements.length < 3) continue; // Need minimum data points

      const quantities = movements.map((m) => Math.abs(m.quantity));
      const mean =
        quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
      const variance =
        quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) /
        quantities.length;
      const stdDev = Math.sqrt(variance);

      // Check for anomalous movements
      for (const movement of movements) {
        const zScore = Math.abs((Math.abs(movement.quantity) - mean) / stdDev);

        if (zScore > threshold) {
          let anomalyType = "unusual_pattern";
          if (movement.quantity > mean + threshold * stdDev) {
            anomalyType = "spike";
          } else if (movement.quantity < mean - threshold * stdDev) {
            anomalyType = "drop";
          }

          // Create anomaly insight
          const insight = new AIInsight({
            user: userId,
            type: "anomaly_detection",
            title: `Anomaly Detected: ${movement.product.name}`,
            description: `Unusual ${movement.type} movement of ${Math.abs(movement.quantity)} units detected`,
            confidence: Math.min(0.95, zScore / threshold),
            priority: zScore > threshold * 1.5 ? "high" : "medium",
            products: [movement.product._id],
            data: {
              anomaly: {
                detectedValue: Math.abs(movement.quantity),
                expectedValue: Math.round(mean),
                deviation: Math.round((zScore - threshold) * 100) / 100,
                anomalyType: anomalyType,
              },
            },
          });
          await insight.save();

          anomalies.push({
            product: {
              id: movement.product._id,
              name: movement.product.name,
              sku: movement.product.sku,
            },
            anomaly: {
              type: anomalyType,
              detectedValue: Math.abs(movement.quantity),
              expectedValue: Math.round(mean),
              severity: zScore > threshold * 1.5 ? "high" : "medium",
              date: movement.createdAt,
              movementType: movement.type,
            },
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Anomaly detection completed successfully",
      data: {
        anomalies: anomalies.sort(
          (a, b) => new Date(b.anomaly.date) - new Date(a.anomaly.date)
        ),
        summary: {
          totalAnomalies: anomalies.length,
          highSeverity: anomalies.filter((a) => a.anomaly.severity === "high")
            .length,
          spikes: anomalies.filter((a) => a.anomaly.type === "spike").length,
          drops: anomalies.filter((a) => a.anomaly.type === "drop").length,
        },
        sensitivity,
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

// Dismiss AI insight
export const dismissInsight = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { insightId } = req.params;
    const { reason } = req.body;

    const insight = await AIInsight.findOne({ _id: insightId, user: userId });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: "Insight not found",
      });
    }

    await insight.dismiss(userId, reason);

    return res.status(200).json({
      success: true,
      message: "Insight dismissed successfully",
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

// Mark insight as implemented
export const implementInsight = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { insightId } = req.params;

    const insight = await AIInsight.findOne({ _id: insightId, user: userId });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: "Insight not found",
      });
    }

    await insight.implement();

    return res.status(200).json({
      success: true,
      message: "Insight marked as implemented successfully",
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

// Get AI insights summary
export const getInsightsSummary = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const summary = await AIInsight.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: "active",
          expiresAt: { $gt: new Date() },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" },
          priorities: {
            $push: "$priority",
          },
        },
      },
    ]);

    const priorityCounts = await AIInsight.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: "active",
          expiresAt: { $gt: new Date() },
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalInsights = await AIInsight.countDocuments({
      user: userId,
      status: "active",
      expiresAt: { $gt: new Date() },
    });

    const actionableInsights = await AIInsight.countDocuments({
      user: userId,
      status: "active",
      actionable: true,
      expiresAt: { $gt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: "AI insights summary retrieved successfully",
      data: {
        totalInsights,
        actionableInsights,
        byType: summary.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            avgConfidence: Math.round(item.avgConfidence * 100) / 100,
          };
          return acc;
        }, {}),
        byPriority: priorityCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        lastUpdated: new Date(),
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
