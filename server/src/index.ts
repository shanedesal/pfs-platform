import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import productsRouter from "./routes/products";
import homepageRouter from "./routes/homepage";
import authRouter from "./routes/auth";
import adminRouter from "./routes/admin";
import cartRouter from "./routes/cart";
import ordersRouter from "./routes/orders";
import addressesRouter from "./routes/addresses";
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
app.use("/api/homepage", homepageRouter);
app.use("/api/products", productsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/addresses", addressesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
