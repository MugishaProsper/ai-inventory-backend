import User from "../models/user.model.js";

export const getLoggedInUser = async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id).select("-password")
        return res.status(200).json({ message: "User found", user: user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}