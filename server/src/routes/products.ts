import { Router } from "express";
import { getProducts, createProduct } from "../controllers/products.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getProducts); // public
router.post("/", authenticate, authorize("ADMIN"), createProduct); // admin only

export default router;