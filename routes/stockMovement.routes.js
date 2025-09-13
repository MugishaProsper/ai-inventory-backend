import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import StockMovement from "../models/stockMovement.model.js";
import mongoose from "mongoose";

const stockMovementRouter = express.Router();

// All stock movement routes require authentication
stockMovementRouter.use(authorize);

// Get stock movements with filtering and pagination
stockMovementRouter.get("/", async (req, res) => {
    try {
        const { id: userId } = req.user;
        const {
            page = 1,
            limit = 20,
            productId = '',
            type = '',
            startDate = '',
            endDate = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = { user: new mongoose.Types.ObjectId(userId) };

        if (productId) {
            query.product = new mongoose.Types.ObjectId(productId);
        }

        if (type) {
            query.type = type;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const movements = await StockMovement.find(query)
            .populate('product', 'name sku')
            .populate('supplier', 'name')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await StockMovement.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: "Stock movements retrieved successfully",
            data: movements,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Get stock movements for a specific product
stockMovementRouter.get("/product/:productId", async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 50 } = req.query;

        const movements = await StockMovement.getProductHistory(productId, parseInt(limit));

        return res.status(200).json({
            success: true,
            message: "Product stock movements retrieved successfully",
            data: movements
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Get stock movement analytics
stockMovementRouter.get("/analytics", async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { period = '30d' } = req.query;

        const analytics = await StockMovement.getAnalytics(userId, period);

        return res.status(200).json({
            success: true,
            message: "Stock movement analytics retrieved successfully",
            data: {
                analytics,
                period
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Get movements by date range
stockMovementRouter.get("/date-range", async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { startDate, endDate, type = '' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date are required"
            });
        }

        const filters = { user: new mongoose.Types.ObjectId(userId) };
        if (type) filters.type = type;

        const movements = await StockMovement.getMovementsByDateRange(startDate, endDate, filters);

        return res.status(200).json({
            success: true,
            message: "Stock movements retrieved successfully",
            data: movements
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

export default stockMovementRouter;