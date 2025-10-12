import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import User from "../models/user.model.js";
configDotenv();

export const authorize = async (req, res, next) => {
  const { token } = req.cookies;
  try {
    if (!token)
      return res
        .status(404)
        .json({ success: false, message: "No token found" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded)
      return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const authorizeRole = (...roles) => {
  return async (req, res, next) => {
    const { id } = req.user;
    try {
      const user = await User.findById(id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      if (!roles.includes(user.role))
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
};
