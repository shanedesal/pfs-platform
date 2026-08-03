import { randomBytes } from "crypto";
import { Request, Response } from "express";
import { OrderStatus, PaymentMethod, Prisma, ProductStatus } from "@prisma/client";
import prisma from "../config/db";
import { notifyOrderCancelledByCustomer } from "../services/email";
import { orderInclude, formatOrder, paramOrderNumber } from "../utils/order-formatting";

const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));
const ORDER_STATUSES = new Set<string>(Object.values(OrderStatus));
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/** Statuses a customer can still back out of — once confirmed, fulfillment has started. */
const CANCELLABLE_STATUSES: OrderStatus[] = [OrderStatus.PENDING];

function isProductPurchasable(product: {
  status: ProductStatus;
  stock: number;
}): boolean {
  if (product.status === ProductStatus.INACTIVE) return false;
  if (product.status === ProductStatus.OUT_OF_STOCK) return false;
  return product.stock > 0;
}

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${date}-${suffix}`;
}

function trimString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

function parsePaymentMethod(value: unknown): PaymentMethod | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (!PAYMENT_METHODS.has(normalized)) return null;
  return normalized as PaymentMethod;
}

/** Renders a saved Address row into the flat text snapshot stored on the order. */
function formatDeliveryAddress(address: {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string | null;
}): string {
  const base = `${address.addressLine1}, ${address.addressLine2}, ${address.city}, ${address.province}`;
  return address.postalCode ? `${base} ${address.postalCode}` : base;
}

/** POST /api/orders — place order from the customer's cart. */
export const placeOrder = async (req: Request, res: Response) => {
  try {
    const addressId = trimString(req.body?.addressId, 100);
    const paymentMethod = parsePaymentMethod(req.body?.paymentMethod);
    const orderNotesRaw =
      typeof req.body?.orderNotes === "string" ? req.body.orderNotes.trim() : "";
    const orderNotes = orderNotesRaw.length > 0 ? orderNotesRaw.slice(0, 1000) : null;

    if (!addressId) {
      res.status(400).json({ message: "Select a delivery address" });
      return;
    }
    if (!paymentMethod) {
      res.status(400).json({ message: "A valid payment method is required" });
      return;
    }

    const userId = req.user!.userId;

    const [user, address] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phoneNumber: true },
      }),
      prisma.address.findUnique({ where: { id: addressId } }),
    ]);

    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Not found or belongs to someone else — same 400 either way (don't leak existence).
    if (!address || address.userId !== userId) {
      res.status(400).json({ message: "Select a valid delivery address" });
      return;
    }

    const deliveryAddress = formatDeliveryAddress(address);

    const customerName = user.name.trim();
    const email = user.email.trim();
    const contactNumber = user.phoneNumber?.trim() ?? "";

    if (!contactNumber) {
      res.status(400).json({
        message: "Add a contact number to your profile before placing an order",
      });
      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: "Your cart is empty" });
      return;
    }

    for (const item of cart.items) {
      if (!isProductPurchasable(item.product)) {
        res.status(400).json({
          message: `"${item.product.name}" is no longer available`,
        });
        return;
      }
      if (item.quantity > item.product.stock) {
        res.status(400).json({
          message: `Only ${item.product.stock} of "${item.product.name}" in stock`,
        });
        return;
      }
    }

    const lineItems = cart.items.map((item) => {
      const unitPrice = Number(item.product.price);
      return {
        productId: item.productId,
        productName: item.product.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const order = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
            status: ProductStatus.ACTIVE,
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new Error(`STOCK:${item.product.name}`);
        }
      }

      const outOfStockIds: string[] = [];
      for (const item of cart.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, stock: true, status: true },
        });
        if (product && product.stock === 0 && product.status === ProductStatus.ACTIVE) {
          outOfStockIds.push(product.id);
        }
      }

      if (outOfStockIds.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: outOfStockIds } },
          data: { status: ProductStatus.OUT_OF_STOCK },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          customerName,
          email,
          contactNumber,
          deliveryAddress,
          paymentMethod,
          orderNotes,
          subtotal,
          total: subtotal,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: orderInclude,
      });
    });

    res.status(201).json(formatOrder(order));
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("STOCK:")) {
      const name = err.message.slice(6);
      res.status(400).json({ message: `"${name}" is no longer in stock` });
      return;
    }
    console.error("[orders] placeOrder", err);
    res.status(500).json({ message: "Failed to place order" });
  }
};

function serializeOrderListItem(order: {
  id: string;
  orderNumber: string;
  paymentMethod: string;
  status: string;
  total: Prisma.Decimal;
  createdAt: Date;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    paymentMethod: order.paymentMethod,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
  };
}

/** GET /api/orders — the signed-in customer's own order history (paginated, optional status filter). */
export const listOrders = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Math.trunc(Number(req.query.page)) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(Number(req.query.pageSize)) || DEFAULT_PAGE_SIZE)
    );
    const statusParam = typeof req.query.status === "string" ? req.query.status.trim() : "";

    const where: Prisma.OrderWhereInput = { userId: req.user!.userId };
    if (statusParam && ORDER_STATUSES.has(statusParam)) {
      where.status = statusParam as OrderStatus;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
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
  } catch (err) {
    console.error("[orders] listOrders", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
};

/** GET /api/orders/:orderNumber — order detail for confirmation (owner only). */
export const getOrder = async (req: Request, res: Response) => {
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

    if (!order || order.userId !== req.user!.userId) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json(formatOrder(order));
  } catch (err) {
    console.error("[orders] getOrder", err);
    res.status(500).json({ message: "Failed to load order" });
  }
};

/**
 * PATCH /api/orders/:orderNumber/cancel — customer self-service cancellation.
 * Only allowed while the order is still `PENDING` (i.e. before an admin has confirmed it).
 * Restores the stock reserved at order placement.
 */
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const orderNumber = paramOrderNumber(req.params.orderNumber);
    if (!orderNumber) {
      res.status(400).json({ message: "Order number is required" });
      return;
    }

    const userId = req.user!.userId;

    const existing = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { select: { productId: true, quantity: true } } },
    });

    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    if (!CANCELLABLE_STATUSES.includes(existing.status)) {
      res.status(400).json({
        message: "This order can no longer be cancelled — it has already been confirmed",
      });
      return;
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await tx.product.updateMany({
          where: { id: item.productId, status: ProductStatus.OUT_OF_STOCK },
          data: { status: ProductStatus.ACTIVE },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { orderNumber },
        data: { status: OrderStatus.CANCELLED },
        include: orderInclude,
      });
    });

    notifyOrderCancelledByCustomer(order);

    res.json(formatOrder(order));
  } catch (err) {
    console.error("[orders] cancelOrder", err);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};
