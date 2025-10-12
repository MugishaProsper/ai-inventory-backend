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
import { supplierSchemas } from "../middlewares/validation.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";

const supplierRouter = express.Router();

// Public routes
supplierRouter.get("/", getAllSuppliers);
supplierRouter.get("/leaderboard", getSupplierLeaderboard);
supplierRouter.get("/:supplierId", validate(supplierSchemas.getSupplierById), getSupplierById);

// Protected routes
supplierRouter.post("/", authorize, validate(supplierSchemas.create), createSupplier);
supplierRouter.put("/:supplierId", authorize, validate(supplierSchemas.update), updateSupplier);
supplierRouter.delete("/:supplierId", authorize, deleteSupplier);
supplierRouter.post("/:supplierId/rate", authorize, validate(supplierSchemas.rate), rateSupplier);
supplierRouter.post("/:supplierId/performance", authorize, validate(supplierSchemas.performance), updateSupplierPerformance);
supplierRouter.get("/:supplierId/analytics", authorize, validate(supplierSchemas.analytics), getSupplierAnalytics);

export default supplierRouter;