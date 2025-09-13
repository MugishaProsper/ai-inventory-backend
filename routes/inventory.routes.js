import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
    getInventory,
    addProductToInventory,
    removeProductFromInventory,
    updateInventory,
    reserveProductQuantity,
    getInventoryAlerts,
    markAlertsAsRead,
    getInventorySummary,
    transferProduct
} from "../controllers/inventory.controllers.js";

const inventoryRouter = express.Router();

// All inventory routes require authentication
inventoryRouter.use(authorize);

inventoryRouter.get("/", getInventory);
inventoryRouter.get("/summary", getInventorySummary);
inventoryRouter.get("/alerts", getInventoryAlerts);
inventoryRouter.post("/", addProductToInventory);
inventoryRouter.put("/", updateInventory);
inventoryRouter.delete("/", removeProductFromInventory);
inventoryRouter.post("/reserve", reserveProductQuantity);
inventoryRouter.post("/transfer", transferProduct);
inventoryRouter.patch("/alerts/read", markAlertsAsRead);

export default inventoryRouter;