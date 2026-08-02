import { Request, Response } from "express";
import { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../config/db";
import { orderInclude, formatOrder, paramOrderNumber } from "../utils/order-formatting";

const SEARCH_MAX_Q = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const ORDER_STATUSES = new Set<string>(Object.values(OrderStatus));

function serializeOrderListItem(order: {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentMethod: string;
  status: string;
  total: Prisma.Decimal;
  createdAt: Date;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    paymentMethod: order.paymentMethod,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
  };
}

/** Admin order list — search (order number/customer name), status filter, pagination. */
export const listAdminOrders = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Math.trunc(Number(req.query.page)) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(Number(req.query.pageSize)) || DEFAULT_PAGE_SIZE)
    );
    const search =
      typeof req.query.search === "string" ? req.query.search.trim().slice(0, SEARCH_MAX_Q) : "";
    const statusParam = typeof req.query.status === "string" ? req.query.status.trim() : "";

    const where: Prisma.OrderWhereInput = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (statusParam && ORDER_STATUSES.has(statusParam)) {
      where.status = statusParam as OrderStatus;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          paymentMethod: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      items: items.map(serializeOrderListItem),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error });
  }
};

/** GET /api/admin/orders/:orderNumber — full order detail (admin can view any order). */
export const getAdminOrder = async (req: Request, res: Response) => {
  try {
    const orderNumber = paramOrderNumber(req.params.orderNumber);
    if (!orderNumber) {
      res.status(400).json({ message: "Order number is required" });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json(formatOrder(order));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error });
  }
};

/** PATCH /api/admin/orders/:orderNumber/status — move an order to a new status. */
export const updateAdminOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderNumber = paramOrderNumber(req.params.orderNumber);
    if (!orderNumber) {
      res.status(400).json({ message: "Order number is required" });
      return;
    }

    const { status } = req.body;
    if (typeof status !== "string" || !ORDER_STATUSES.has(status)) {
      res.status(400).json({
        message: `status must be one of ${Object.values(OrderStatus).join(", ")}`,
      });
      return;
    }

    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (!existing) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const order = await prisma.order.update({
      where: { orderNumber },
      data: { status: status as OrderStatus },
      include: orderInclude,
    });

    res.json(formatOrder(order));
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error });
  }
};
