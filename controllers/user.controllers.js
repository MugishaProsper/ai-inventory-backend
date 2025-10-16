import User from "../models/user.model.js";

export const getLoggedInUser = async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id).select("-password")
        return res.status(200).json({ success: true, message: "User found", user: user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message })
    }
};

export const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select("-password");
        return res.status(200).json({ success: true, message: "User found", user: user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message })
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        return res.status(200).json({ success: true, message: "Users found", users: users })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message })
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.user;
    const { fullname, phone_number, address } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        user.fullname = fullname;
        user.phone_number = phone_number ? phone_number : undefined;
        user.address = address ? address : undefined;
        await user.save();
        return res.status(200).json({ success: true, message: "User updated successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message })
    }
};

export const deleteMyAccount = async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        await user.deleteOne();
        return res.status(200).json({ success: true, message: "User deleted successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message })
    }
};

export const deleteAccount = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        await user.deleteOne();
        return res.status(200).json({ success: true, message: "User deleted successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message })
    }
}

export const changePassword = async (req, res) => {
    const { id } = req.user;
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const isPasswordCorrect = await user.comparePassword(oldPassword);
        if (!isPasswordCorrect) return res.status(400).json({ success: false, message: "Invalid old password" });
        user.password = newPassword;
        await user.save();
        return res.status(200).json({ success: true, message: "Password changed successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message })
    }
}