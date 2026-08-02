import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import { revokeAllUserRefreshTokens } from "../utils/tokens";

const SEARCH_MAX_Q = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Express 5 route params can be `string | string[] | undefined`; narrow to a single id. */
function requireIdParam(req: Request, res: Response): string | null {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid id parameter" });
    return null;
  }
  return id;
}

function serializeCustomer(user: {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

function serializeAddress(address: {
  id: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: Date;
}) {
  return {
    id: address.id,
    label: address.label,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
  };
}

/**
 * Admin customer list — search (name/email), account-status filter, pagination.
 * Order count and lifetime purchase total are computed from non-cancelled orders only.
 */
export const listAdminCustomers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Math.trunc(Number(req.query.page)) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(Number(req.query.pageSize)) || DEFAULT_PAGE_SIZE)
    );
    const search =
      typeof req.query.search === "string" ? req.query.search.trim().slice(0, SEARCH_MAX_Q) : "";
    const statusParam = typeof req.query.status === "string" ? req.query.status.trim() : "";

    const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (statusParam === "active") where.isActive = true;
    if (statusParam === "disabled") where.isActive = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);
    const orderStats = userIds.length
      ? await prisma.order.groupBy({
          by: ["userId"],
          where: { userId: { in: userIds }, status: { not: "CANCELLED" } },
          _sum: { total: true },
          _count: { _all: true },
        })
      : [];
    const statsByUser = new Map(
      orderStats.map((s) => [
        s.userId,
        { orderCount: s._count._all, totalPurchase: Number(s._sum.total ?? 0) },
      ])
    );

    res.json({
      items: users.map((u) => ({
        ...serializeCustomer(u),
        ...(statsByUser.get(u.id) ?? { orderCount: 0, totalPurchase: 0 }),
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers", error });
  }
};

/** GET /api/admin/customers/:id — profile, order history, and saved addresses for one customer. */
export const getAdminCustomer = async (req: Request, res: Response) => {
  try {
    const id = requireIdParam(req, res);
    if (!id) return;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || user.role !== "CUSTOMER") {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    const [orders, addresses] = await Promise.all([
      prisma.order.findMany({
        where: { userId: id },
        select: {
          id: true,
          orderNumber: true,
          paymentMethod: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.address.findMany({
        where: { userId: id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
    ]);

    const nonCancelledOrders = orders.filter((o) => o.status !== "CANCELLED");
    const orderCount = nonCancelledOrders.length;
    const totalPurchase = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total), 0);

    res.json({
      ...serializeCustomer(user),
      orderCount,
      totalPurchase,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        paymentMethod: o.paymentMethod,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
      addresses: addresses.map(serializeAddress),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customer", error });
  }
};

/** PATCH /api/admin/customers/:id/status — enable/disable a customer account. Disabling revokes their sessions. */
export const updateAdminCustomerStatus = async (req: Request, res: Response) => {
  try {
    const id = requireIdParam(req, res);
    if (!id) return;

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      res.status(400).json({ message: "isActive must be a boolean" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "CUSTOMER") {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!isActive) {
      // Disabling logs the customer out of every device immediately, not just future logins.
      await revokeAllUserRefreshTokens(id);
    }

    res.json(serializeCustomer(user));
  } catch (error) {
    res.status(500).json({ message: "Failed to update customer status", error });
  }
};
