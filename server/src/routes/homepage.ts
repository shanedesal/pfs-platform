import { Router } from "express";
import { getHomepageFeatured } from "../controllers/homepage.controller";

const router = Router();

router.get("/featured", getHomepageFeatured); // public — homepage only

export default router;
