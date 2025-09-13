import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryAnalytics,
    updateAllCategoryMetadata
} from "../controllers/category.controllers.js";

const categoryRouter = express.Router();

// Public routes
categoryRouter.get("/", getAllCategories);
categoryRouter.get("/:categoryId", getCategoryById);

// Protected routes
categoryRouter.post("/", authorize, createCategory);
categoryRouter.put("/:categoryId", authorize, updateCategory);
categoryRouter.delete("/:categoryId", authorize, deleteCategory);
categoryRouter.get("/:categoryId/analytics", authorize, getCategoryAnalytics);
categoryRouter.post("/update-metadata", authorize, updateAllCategoryMetadata);

export default categoryRouter;