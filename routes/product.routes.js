import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import { createProduct, deleteProduct, getAllProducts, getMyProducts } from "../controllers/product.controllers.js";

const productRouter = express.Router();

productRouter.post("/", authorize, createProduct);
productRouter.delete("/:productId", authorize, deleteProduct);
productRouter.get("/", getAllProducts);
productRouter.get("/me", authorize, getMyProducts);

export default productRouter