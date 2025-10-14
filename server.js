import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectToDatabase } from "./config/db.config.js";

// Import route handlers
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import inventoryRouter from "./routes/inventory.routes.js";
import categoryRouter from "./routes/category.routes.js";
import supplierRouter from "./routes/supplier.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import aiRouter from "./routes/ai.routes.js";
import stockMovementRouter from "./routes/stockMovement.routes.js";

import { configDotenv } from "dotenv";
configDotenv()

const app = express();

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/stock-movements", stockMovementRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Inventrika API is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// API documentation endpoint
app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Inventrika AI-Powered Inventory Management API",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            users: "/api/users",
            products: "/api/products",
            inventory: "/api/inventory",
            categories: "/api/categories",
            suppliers: "/api/suppliers",
            analytics: "/api/analytics",
            ai: "/api/ai",
            stockMovements: "/api/stock-movements"
        },
        documentation: {
            postman: "/api/docs/postman",
            swagger: "/api/docs/swagger"
        }
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Global error:", error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Inventrika API Server running on http://localhost:${PORT}`);
    console.log(`📊 API Documentation available at http://localhost:${PORT}/api`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/api/health`);
    
    try {
        await connectToDatabase();
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
    }
});