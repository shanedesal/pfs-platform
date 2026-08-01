import { Router } from "express";
import {
  getHomepageCategories,
  getHomepageFeatured,
} from "../controllers/homepage.controller";

const router = Router();

router.get("/featured", getHomepageFeatured); // public — homepage only
router.get("/categories", getHomepageCategories); // public — homepage only

export default router;
