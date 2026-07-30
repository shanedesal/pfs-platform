import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import productsRouter from "./routes/products";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true, // required so cookies are sent cross-origin
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});