import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import { connectToDatabase } from "./config/db.config.js";
import userRouter from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import productRouter from "./routes/product.routes.js";
import inventoryRouter from "./routes/inventory.routes.js";

const app = express();

const PORT = process.env.PORT || 5000

app.use(cors());
app.use(cookieParser())
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/inventory", inventoryRouter);

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await connectToDatabase()
})