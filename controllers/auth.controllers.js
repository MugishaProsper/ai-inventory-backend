import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookie } from "../utils/cookie.utils.js";

export const register = async (req, res) => {
    const { fullname, username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
        if (existingUser) return res.status(403).json({ message: "User already exists" });
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt)
        const user = new User({
            fullname: fullname,
            username: username,
            email: email,
            password: hashedPassword
        });
        await user.save();
        return res.status(201).json({ message: "Registered successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) return res.status(404).json({ message: "User not found" });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(403).json({ message: "Incorrect password" });
        };
        generateTokenAndSetCookie(user._id, res);
        return res.status(200).json({ message: "Logged in successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};

export const logout = async (req, res) => {
    try {
        return res.clearCookie("token")
            .status(200).json({ message: "Logged out" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}