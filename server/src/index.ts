import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import productsRouter from "./routes/products";
import authRouter from "./routes/auth";
import { requestLogger } from "./middleware/requestLogger";
import { validateEnv } from "./utils/env";

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true, // required so cookies are sent cross-origin
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(requestLogger);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
