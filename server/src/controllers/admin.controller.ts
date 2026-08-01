import { Request, Response } from "express";
import prisma from "../config/db";

/** Summary counts for the admin dashboard overview cards. */
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [totalProducts, totalCustomers] = await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
    ]);

    res.json({ totalProducts, totalCustomers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error });
  }
};
