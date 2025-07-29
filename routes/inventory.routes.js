import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import { addProductToInventory, getInventory, removeProductsFromInventory, updateInventory } from "../controllers/inventory.controllers.js";

const inventoryRouter = express.Router();

inventoryRouter.post("/", authorize, addProductToInventory);
inventoryRouter.get("/", authorize, getInventory);
inventoryRouter.put("/", authorize, updateInventory);
inventoryRouter.delete("/", authorize, removeProductsFromInventory)

export default inventoryRouter