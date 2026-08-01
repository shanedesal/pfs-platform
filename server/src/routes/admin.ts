import { Router } from "express";
import { getDashboardStats } from "../controllers/admin.controller";
import {
  listAdminProducts,
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  uploadProductImage,
} from "../controllers/admin-products.controller";
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../controllers/admin-categories.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN")); // everything under /api/admin is admin-only

router.get("/dashboard-stats", getDashboardStats);

router.get("/products", listAdminProducts);
router.get("/products/:id", getAdminProduct);
router.post("/products", createAdminProduct);
router.put("/products/:id", updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);
router.post("/products/upload-image", uploadSingleImage, uploadProductImage);

router.get("/categories", listAdminCategories);
router.post("/categories", createAdminCategory);
router.put("/categories/:id", updateAdminCategory);
router.delete("/categories/:id", deleteAdminCategory);

export default router;
