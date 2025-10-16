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
import multer from "multer";
import { uploadImages } from "../middlewares/upload.middleware.js";

const supplierRouter = express.Router();

// Public routes
supplierRouter.get("/", getAllSuppliers);
supplierRouter.get("/leaderboard", getSupplierLeaderboard);
supplierRouter.get("/:supplierId", getSupplierById);

const upload = multer({ dest: 'uploads/' });

// Protected routes
supplierRouter.post("/", authorize, upload.single('logo'), uploadImages("suppliers"), validate(supplierSchemas.create), createSupplier);
supplierRouter.put("/:supplierId", authorize, upload.single('logo'), uploadImages("suppliers"), validate(supplierSchemas.update), updateSupplier);
supplierRouter.delete("/:supplierId", authorize, deleteSupplier);
supplierRouter.post("/:supplierId/rate", authorize, rateSupplier);
supplierRouter.post("/:supplierId/performance", authorize, updateSupplierPerformance);
supplierRouter.get("/:supplierId/analytics", authorize, getSupplierAnalytics);

export default supplierRouter;