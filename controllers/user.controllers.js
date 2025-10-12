import User from "../models/user.model.js";

export const getLoggedInUser = async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id).select("-password")
        return res.status(200).json({ success : true, message: "User found", user: user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success : false, message: "Internal server error", error : error.message })
    }
};

export const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select("-password");
        return res.status(200).json({ success : true, message : "User found", user : user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success : false, message : "Internal server error", error : error.message })
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        return res.status(200).json({ success : true, message : "Users found", users : users })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success : false, message : "Internal server error", error : error.message })
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.user;
    const { fullname, username, password } = req.body;
    try {
        const user = await User.findById(id);
        if(!user) return res.status(404).json({ success : false, message : "User not found" });
        user.fullname = fullname;
        user.username = username;
        user.password = password;
        await user.save();
        return res.status(200).json({ success : true, message : "User updated successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success : false, message : "Internal server error", error : error.message })
    } 
}