import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv()

export const generateTokenAndSetCookie = (userId, res) => {
    try {
        const payload = {
            id : userId
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn : "15d" });
        res.cookie("token", token, {
            secure : process.env.NODE_ENV === "production",
            maxAge : 15 * 24 * 60 * 60 * 1000,
            httpOnly : true,
            sameSite : "strict"
        })
    } catch (error) {
        throw new Error(error)
    }
}