import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: "CUSTOMER" },
    });

    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res
      .cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 })
      .cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .status(201)
      .json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res
      .cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 })
      .cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const payload = verifyRefreshToken(token);
    const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role });

    res
      .cookie("accessToken", newAccessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 })
      .json({ message: "Token refreshed" });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = (req: Request, res: Response) => {
  res
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json({ message: "Logged out" });
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error });
  }
};