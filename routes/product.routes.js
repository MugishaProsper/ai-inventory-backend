import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import { createProduct, deleteProduct, getAllProducts, getMyProducts, likeProduct, rateProduct, unlikeProject } from "../controllers/product.controllers.js";

const productRouter = express.Router();

productRouter.post("/", authorize, createProduct);
productRouter.delete("/:productId", authorize, deleteProduct);
productRouter.get("/", getAllProducts);
productRouter.get("/me", authorize, getMyProducts);
productRouter.post("/like/:productId", authorize, likeProduct);
productRouter.post("/unlike/:productId", authorize, unlikeProject);
productRouter.post("/rating/:productId", rateProduct)

export default productRouter