import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"], default: "USER" }
}, { timestamps: true });

const User = mongoose.model("users", userSchema);
export default User