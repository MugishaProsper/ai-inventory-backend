import express from "express";
import { login, logout, register } from "../controllers/auth.controllers.js";
import { authorize } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", authorize, logout);

export default authRouter