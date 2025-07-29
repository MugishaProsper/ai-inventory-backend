import express from "express";
import { getLoggedInUser } from "../controllers/user.controllers.js";
import { authorize } from "../middlewares/auth.middleware.js"

const userRouter = express.Router();

userRouter.get("/", authorize, getLoggedInUser);

export default userRouter;