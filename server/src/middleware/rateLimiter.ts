import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  skipSuccessfulRequests: true, // only counts failed attempts
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many accounts created. Try again later." },
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many refresh attempts. Try again later." },
});

export const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many logout attempts. Try again later." },
});

export const updateProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many profile updates. Try again later." },
});

export const addressWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many address changes. Try again later." },
});

export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification emails requested. Try again later." },
});

/** Caps brute-force attempts against verification tokens. */
export const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Try again later." },
});
