import mongoose from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();

export const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to MongoDB"))
    } catch (error) {
        throw new Error(error)
    }
}