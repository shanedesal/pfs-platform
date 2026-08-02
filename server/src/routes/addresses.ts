import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { addressWriteLimiter } from "../middleware/rateLimiter";
import {
  listAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/addresses.controller";

const router = Router();

router.use(authenticate);

router.get("/", listAddresses);
router.post("/", addressWriteLimiter, createAddress);
router.put("/:id", addressWriteLimiter, updateAddress);
router.patch("/:id/default", addressWriteLimiter, setDefaultAddress);
router.delete("/:id", addressWriteLimiter, deleteAddress);

export default router;
