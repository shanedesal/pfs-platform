import { Router } from "express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
} from "../controllers/products.controller";

const router = Router();

router.get("/search", searchProducts); // public
router.get("/by-category", getProductsByCategory); // public
router.get("/:id", getProductById); // public
router.get("/", getProducts); // public catalog (paginated)

export default router;
