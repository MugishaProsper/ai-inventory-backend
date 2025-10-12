import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/cookie.utils.js";
import { generateResetPassword } from "../utils/generate.reset.js";

export const register = async (req, res) => {
  const { fullname, username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });
    if (existingUser)
      return res.status(403).json({ message: "User already exists" });
    const user = new User({
      fullname: fullname,
      username: username,
      email: email,
      password: password,
    });
    await user.save();
    return res.status(201).json({ message: "Registered successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(403).json({ message: "Incorrect password" });
    }
    generateTokenAndSetCookie(user._id, res);
    return res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    return res.clearCookie("token").status(200).json({ message: "Logged out" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "No such email" });
    const resetPassword = await generateResetPassword();
    user.resetPassword = resetPassword;
    await user.save();

    return res.status(200).json({ message: "Reset password sent" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyPasswordResetCode = async (req, res) => {
  const { email, resetCode } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No such email" });
    }
    const isCodeValid = user.resetCode === resetCode;
    if (!isCodeValid) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid reset code" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Reset code verified successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { id } = req.user;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.password = password;
    user.resetCode = null;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getCurrentUser = async (req, res) => {
  const { id } = req.user;
  try {
    const user = await User.findById(id).select("-password");
    return res.status(200).json({ success : true, message : "User found", user : user })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success : false, message : "Internal server error", error : error.message })
  }
}