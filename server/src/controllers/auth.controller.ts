import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { sendRegistrationVerificationEmail } from "../services/email/verification-emails";
import { verifyRefreshToken, verifyAccessToken } from "../utils/jwt";
import {
  generateVerificationToken,
  hashVerificationToken,
  verificationExpiresAt,
} from "../utils/verification";
import { hashToken, issueTokenPair, revokeRefreshToken } from "../utils/tokens";
import { normalizePhoneNumber } from "../utils/phone";

// Cross-origin deploys (e.g. Render web + API on different subdomains) require
// SameSite=None + Secure so browsers send cookies on credentialed fetch requests.
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "strict") as "none" | "strict",
  path: "/",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

function serializeUser(user: {
  id: string;
  email: string;
  name: string;
  phoneNumber: string | null;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phoneNumber: user.phoneNumber,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function parseRegisterFields(body: unknown):
  | { ok: true; email: string; password: string; name: string }
  | { ok: false; message: string } {
  const { email, password, name } = (body ?? {}) as Record<string, unknown>;

  if (!email || !password || !name) {
    return { ok: false, message: "Missing required fields" };
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return { ok: false, message: "Invalid email address" };
  }

  if (typeof password !== "string" || password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters" };
  }

  if (typeof name !== "string" || name.trim().length < 1) {
    return { ok: false, message: "Name is required" };
  }

  return {
    ok: true,
    email: email.trim().toLowerCase(),
    password,
    name: name.trim(),
  };
}

async function createOrRefreshPendingRegistration(params: {
  email: string;
  name: string;
  password: string;
}): Promise<{ rawToken: string }> {
  const hashedPassword = await bcrypt.hash(params.password, 12);
  const rawToken = generateVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = verificationExpiresAt();

  await prisma.pendingRegistration.upsert({
    where: { email: params.email },
    create: {
      email: params.email,
      name: params.name,
      password: hashedPassword,
      tokenHash,
      expiresAt,
    },
    update: {
      name: params.name,
      password: hashedPassword,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken };
}

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = parseRegisterFields(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    const { email, password, name } = parsed;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const { rawToken } = await createOrRefreshPendingRegistration({ email, name, password });

    sendRegistrationVerificationEmail({ email, name, token: rawToken });

    return res.status(202).json({
      message: "Check your email to verify your account before signing in.",
      email,
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const tokenHash = hashVerificationToken(token);
    const pending = await prisma.pendingRegistration.findUnique({
      where: { tokenHash },
    });

    if (!pending || pending.expiresAt <= new Date()) {
      // Parallel duplicate verify (e.g. React Strict Mode) may have already succeeded.
      const accessToken = req.cookies?.accessToken;
      if (accessToken) {
        try {
          const payload = verifyAccessToken(accessToken);
          const sessionUser = await prisma.user.findUnique({
            where: { id: payload.userId },
          });
          if (sessionUser?.emailVerified) {
            return res.json(serializeUser(sessionUser));
          }
        } catch {
          // fall through
        }
      }

      return res.status(400).json({
        message: "This verification link is invalid or has expired. Request a new one.",
        code: "INVALID_VERIFICATION_TOKEN",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: pending.email } });
    if (existingUser) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } }).catch(() => {});
      if (existingUser.emailVerified) {
        const { accessToken, refreshToken } = await issueTokenPair({
          userId: existingUser.id,
          role: existingUser.role,
        });
        return setAuthCookies(res, accessToken, refreshToken).json(serializeUser(existingUser));
      }
      return res.status(409).json({ message: "Email already in use" });
    }

    const now = new Date();
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: pending.email,
          password: pending.password,
          name: pending.name,
          role: "CUSTOMER",
          emailVerified: true,
          emailVerifiedAt: now,
        },
      });
      await tx.pendingRegistration.delete({ where: { id: pending.id } });
      return created;
    });

    const { accessToken, refreshToken } = await issueTokenPair({
      userId: user.id,
      role: user.role,
    });

    setAuthCookies(res, accessToken, refreshToken).json(serializeUser(user));
  } catch (error) {
    console.error("Email verification failed:", error);
    res.status(500).json({ message: "Email verification failed" });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }

    const pending = await prisma.pendingRegistration.findUnique({ where: { email } });

    // Generic response — do not reveal whether a pending registration exists.
    const genericMessage =
      "If that email has a pending registration, we sent a new verification link.";

    if (!pending) {
      return res.json({ message: genericMessage });
    }

    const rawToken = generateVerificationToken();
    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: {
        tokenHash: hashVerificationToken(rawToken),
        expiresAt: verificationExpiresAt(),
      },
    });

    sendRegistrationVerificationEmail({
      email: pending.email,
      name: pending.name,
      token: rawToken,
    });

    return res.json({ message: genericMessage });
  } catch (error) {
    console.error("Resend verification failed:", error);
    res.status(500).json({ message: "Failed to resend verification email" });
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

    if (!user) {
      const pending = await prisma.pendingRegistration.findUnique({
        where: { email: normalizedEmail },
      });
      const valid = await bcrypt.compare(password, pending?.password ?? DUMMY_PASSWORD_HASH);

      if (pending && valid) {
        return res.status(403).json({
          message: "Verify your email before signing in. Check your inbox for the confirmation link.",
          code: "EMAIL_NOT_VERIFIED",
          email: normalizedEmail,
        });
      }

      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been disabled. Contact support for help." });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Verify your email before signing in.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    const { accessToken, refreshToken } = await issueTokenPair({
      userId: user.id,
      role: user.role,
    });

    setAuthCookies(res, accessToken, refreshToken).json(serializeUser(user));
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
        select: { id: true, role: true, emailVerified: true, isActive: true },
      });

      if (!user || !user.isActive || !user.emailVerified) {
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
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user || !user.emailVerified) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json(serializeUser(user));
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

    res.json(serializeUser(user));
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
