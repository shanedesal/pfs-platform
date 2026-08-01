import { Router } from "express";
import { getProducts, getProductsByCategory, searchProducts } from "../controllers/products.controller";

const router = Router();

router.get("/search", searchProducts); // public
router.get("/by-category", getProductsByCategory); // public
router.get("/", getProducts); // public

export default router;
