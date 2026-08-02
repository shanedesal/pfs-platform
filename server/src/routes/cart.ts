import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} from "../controllers/cart.controller";

const router = Router();

router.use(authenticate, authorize("CUSTOMER"));

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:productId", updateCartItem);
router.delete("/items/:productId", removeCartItem);

export default router;
