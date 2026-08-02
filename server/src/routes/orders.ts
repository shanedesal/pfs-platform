import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { cancelOrder, getOrder, listOrders, placeOrder } from "../controllers/orders.controller";

const router = Router();

router.use(authenticate, authorize("CUSTOMER"));

router.post("/", placeOrder);
router.get("/", listOrders);
router.get("/:orderNumber", getOrder);
router.patch("/:orderNumber/cancel", cancelOrder);

export default router;
