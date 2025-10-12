import express from "express";
import { getLoggedInUser, getUserById, updateUser, getAllUsers } from "../controllers/user.controllers.js";
import { authorize, authorizeRole } from "../middlewares/auth.middleware.js"

const userRouter = express.Router();

userRouter.get("/", authorize, getLoggedInUser);
userRouter.get("/:userId", authorize, getUserById);
userRouter.put("/:userId", authorize, updateUser);
userRouter.get("/all", authorize, authorizeRole(["ADMIN", "SUPER_ADMIN"]), getAllUsers)

export default userRouter;