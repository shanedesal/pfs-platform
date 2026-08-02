import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { getOrder, placeOrder } from "../controllers/orders.controller";

const router = Router();

router.use(authenticate, authorize("CUSTOMER"));

router.post("/", placeOrder);
router.get("/:orderNumber", getOrder);

export default router;
