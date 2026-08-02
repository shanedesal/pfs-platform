import { randomBytes } from "crypto";
import { Request, Response } from "express";
import { PaymentMethod, Prisma, ProductStatus } from "@prisma/client";
import prisma from "../config/db";

const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));

const orderInclude = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      product: {
        select: { id: true, imageUrl: true },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

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

function formatOrder(order: OrderWithItems) {
  const items = order.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    lineTotal: Number(item.lineTotal),
    imageUrl: item.product.imageUrl,
  }));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    contactNumber: order.contactNumber,
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod,
    orderNotes: order.orderNotes,
    status: order.status,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt.toISOString(),
  };
}

function paramOrderNumber(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0].trim();
  return "";
}

/** POST /api/orders — place order from the customer's cart. */
export const placeOrder = async (req: Request, res: Response) => {
  try {
    const deliveryAddress = trimString(req.body?.deliveryAddress, 500);
    const paymentMethod = parsePaymentMethod(req.body?.paymentMethod);
    const orderNotesRaw =
      typeof req.body?.orderNotes === "string" ? req.body.orderNotes.trim() : "";
    const orderNotes = orderNotesRaw.length > 0 ? orderNotesRaw.slice(0, 1000) : null;

    if (!deliveryAddress) {
      res.status(400).json({ message: "Delivery address is required" });
      return;
    }
    if (!paymentMethod) {
      res.status(400).json({ message: "A valid payment method is required" });
      return;
    }

    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phoneNumber: true },
    });

    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

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
