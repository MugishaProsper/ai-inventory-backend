import express from "express";
import { forgotPassword, getCurrentUser, login, logout, register, resetPassword, verifyPasswordResetCode } from "../controllers/auth.controllers.js";
import { authorize } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", authorize, logout);
authRouter.get("/me", authorize, getCurrentUser);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/verify-reset-code", verifyPasswordResetCode);

export default authRouter