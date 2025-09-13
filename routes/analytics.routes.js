import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
    getDashboardAnalytics,
    getInventoryAnalytics,
    getSalesAnalytics,
    getSupplierPerformanceAnalytics
} from "../controllers/analytics.controllers.js";

const analyticsRouter = express.Router();

// All analytics routes require authentication
analyticsRouter.use(authorize);

analyticsRouter.get("/dashboard", getDashboardAnalytics);
analyticsRouter.get("/inventory", getInventoryAnalytics);
analyticsRouter.get("/sales", getSalesAnalytics);
analyticsRouter.get("/suppliers", getSupplierPerformanceAnalytics);

export default analyticsRouter;