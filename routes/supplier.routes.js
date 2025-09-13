import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    rateSupplier,
    updateSupplierPerformance,
    getSupplierAnalytics,
    getSupplierLeaderboard
} from "../controllers/supplier.controllers.js";

const supplierRouter = express.Router();

// Public routes
supplierRouter.get("/", getAllSuppliers);
supplierRouter.get("/leaderboard", getSupplierLeaderboard);
supplierRouter.get("/:supplierId", getSupplierById);

// Protected routes
supplierRouter.post("/", authorize, createSupplier);
supplierRouter.put("/:supplierId", authorize, updateSupplier);
supplierRouter.delete("/:supplierId", authorize, deleteSupplier);
supplierRouter.post("/:supplierId/rate", authorize, rateSupplier);
supplierRouter.post("/:supplierId/performance", authorize, updateSupplierPerformance);
supplierRouter.get("/:supplierId/analytics", authorize, getSupplierAnalytics);

export default supplierRouter;