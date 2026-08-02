import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { verifyRefreshToken } from "../utils/jwt";
import { hashToken, issueTokenPair, revokeRefreshToken } from "../utils/tokens";
import { normalizePhoneNumber } from "../utils/phone";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Precomputed bcrypt hash so missing-user logins still pay the compare cost
const DUMMY_PASSWORD_HASH =
  "$2b$12$GVVRviBQHhuHKUx2adJZQe7EyXLfMEsMiXNMJJoJiZYrwQeH/dtum";

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  return res
    .cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 })
    .cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (typeof name !== "string" || name.trim().length < 1) {
      return res.status(400).json({ message: "Name is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        role: "CUSTOMER",
      },
    });

    const { accessToken, refreshToken } = await issueTokenPair({
      userId: user.id,
      role: user.role,
    });

    setAuthCookies(res, accessToken, refreshToken)
      .status(201)
      .json({
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt,
      });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always run bcrypt.compare to avoid email enumeration via timing
    const hash = user?.password ?? DUMMY_PASSWORD_HASH;
    const validPassword = await bcrypt.compare(password, hash);

    if (!user || !validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await issueTokenPair({
      userId: user.id,
      role: user.role,
    });

    setAuthCookies(res, accessToken, refreshToken).json({
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/** Concurrent refreshes revoke the same row within this window; treat as race, not theft. */
const REFRESH_REUSE_GRACE_MS = 30_000;

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const payload = verifyRefreshToken(token);
    const tokenHash = hashToken(token);
    const now = new Date();

    // Atomically claim the token so only one concurrent refresh succeeds
    const claimed = await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        userId: payload.userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });

    if (claimed.count === 1) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true },
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const { accessToken, refreshToken } = await issueTokenPair({
        userId: user.id,
        role: user.role,
      });

      return setAuthCookies(res, accessToken, refreshToken).json({
        message: "Token refreshed",
      });
    }

    // Claim failed — distinguish concurrent rotation from stolen-token reuse
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (
      stored &&
      stored.userId === payload.userId &&
      stored.revokedAt &&
      now.getTime() - stored.revokedAt.getTime() > REFRESH_REUSE_GRACE_MS
    ) {
      await prisma.refreshToken.updateMany({
        where: { userId: payload.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return res.status(401).json({ message: "Invalid refresh token" });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await revokeRefreshToken(token);
    }
  } catch (error) {
    console.error("Logout token revoke failed:", error);
  }

  res
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json({ message: "Logged out" });
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

/** PATCH /api/auth/me — update the signed-in user's own profile (contact number only, for now). */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber);

    if (!phoneNumber) {
      return res.status(400).json({
        message:
          "Enter a valid Philippine mobile number (11 digits starting with 09), e.g. 0912 234 2345",
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { phoneNumber },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
