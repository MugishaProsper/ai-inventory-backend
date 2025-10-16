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
import { uploadImages, uploadImage } from "../middlewares/upload.middleware.js";

const supplierRouter = express.Router();

// Parse JSON fields that may arrive as strings via multipart/form-data
const parseJsonFields = (req, _res, next) => {
    try {
        if (typeof req.body?.contact === 'string') {
            try { req.body.contact = JSON.parse(req.body.contact); } catch { }
        }
        if (typeof req.body?.address === 'string') {
            try { req.body.address = JSON.parse(req.body.address); } catch { }
        }
    } finally {
        next();
    }
};

// Public routes
supplierRouter.get("/", getAllSuppliers);
supplierRouter.get("/leaderboard", getSupplierLeaderboard);
supplierRouter.get("/:supplierId", getSupplierById);

const upload = multer({ dest: 'uploads/' });

// Protected routes
supplierRouter.post("/", authorize, upload.single('logo'), uploadImage("suppliers"), parseJsonFields, validate(supplierSchemas.create), createSupplier);
supplierRouter.put("/:supplierId", authorize, upload.single('logo'), uploadImage("suppliers"), parseJsonFields, validate(supplierSchemas.update), updateSupplier);
supplierRouter.delete("/:supplierId", authorize, deleteSupplier);
supplierRouter.post("/:supplierId/rate", authorize, rateSupplier);
supplierRouter.post("/:supplierId/performance", authorize, updateSupplierPerformance);
supplierRouter.get("/:supplierId/analytics", authorize, getSupplierAnalytics);

export default supplierRouter;