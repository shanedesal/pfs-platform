import { Router } from "express";
import { getProducts, createProduct } from "../controllers/products.controllers";

const router = Router();

router.get("/", getProducts);
router.post("/", createProduct);

export default router;