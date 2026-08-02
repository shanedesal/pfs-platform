import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  logoutLimiter,
  updateProfileLimiter,
} from "../middleware/rateLimiter";

const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logoutLimiter, logout);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, updateProfileLimiter, updateProfile);

export default router;