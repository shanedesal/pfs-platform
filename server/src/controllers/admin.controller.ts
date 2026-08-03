import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import prisma from "../config/db";

/** Summary counts for the admin dashboard overview cards. */
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      pendingOrders,
      completedOrders,
      salesAggregate,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { total: true },
      }),
    ]);

    res.json({
      totalProducts,
      totalCustomers,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalSales: Number(salesAggregate._sum.total ?? 0),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error });
  }
};
