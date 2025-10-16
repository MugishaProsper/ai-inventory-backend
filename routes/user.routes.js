import express from "express";
import { getLoggedInUser, getUserById, updateUser, getAllUsers, changePassword } from "../controllers/user.controllers.js";
import { authorize, authorizeRole } from "../middlewares/auth.middleware.js"

const userRouter = express.Router();

// Current user endpoints first to avoid matching dynamic :userId route
userRouter.get("/", authorize, getLoggedInUser);
userRouter.put("/change-password", authorize, changePassword);
userRouter.put("/me", authorize, updateUser);

// Admin or specific user endpoints
userRouter.get("/all", authorize, authorizeRole(["ADMIN", "SUPER_ADMIN"]), getAllUsers);
userRouter.get("/:userId", authorize, getUserById);
userRouter.put("/:userId", authorize, updateUser);

export default userRouter;