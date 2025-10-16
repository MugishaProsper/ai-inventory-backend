import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import multer from "multer";
import { uploadImages } from "../middlewares/upload.middleware.js";
import {
    getAllProducts,
    getMyProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    rateProduct,
    getProductsNeedingReorder,
    bulkUpdateProducts
} from "../controllers/product.controllers.js";

const productRouter = express.Router();

// Public routes
productRouter.get("/", getAllProducts);
productRouter.post("/:productId/rate", rateProduct);

// Protected routes
const upload = multer({ limits: { files: 10 } });
productRouter.get("/me", authorize, getMyProducts);
productRouter.get("/reorder", authorize, getProductsNeedingReorder);
productRouter.get("/:productId", authorize, getProductById);
productRouter.post("/", authorize, upload.array("images", 10), uploadImages("products"), createProduct);
productRouter.put("/:productId", authorize, upload.array("images", 10), uploadImages("products"), updateProduct);
productRouter.delete("/:productId", authorize, deleteProduct);
productRouter.patch("/:productId/stock", authorize, updateProductStock);
productRouter.patch("/bulk", authorize, bulkUpdateProducts);

export default productRouter;