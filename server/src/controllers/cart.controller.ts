import { Request, Response } from "express";
import { Prisma, ProductStatus } from "@prisma/client";
import prisma from "../config/db";

const CART_PRODUCT_SELECT = {
  id: true,
  name: true,
  price: true,
  stock: true,
  imageUrl: true,
  status: true,
} as const;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: { product: { select: CART_PRODUCT_SELECT } },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function isProductPurchasable(product: {
  status: ProductStatus;
  stock: number;
}): boolean {
  if (product.status === ProductStatus.INACTIVE) return false;
  if (product.status === ProductStatus.OUT_OF_STOCK) return false;
  return product.stock > 0;
}

function formatCart(cart: NonNullable<CartWithItems>) {
  const items = cart.items.map((item) => {
    const price = Number(item.product.price);
    const available = isProductPurchasable(item.product);
    return {
      productId: item.productId,
      quantity: item.quantity,
      lineTotal: price * item.quantity,
      available,
      product: {
        id: item.product.id,
        name: item.product.name,
        price,
        stock: item.product.stock,
        imageUrl: item.product.imageUrl,
        status: item.product.status,
      },
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    itemCount,
    subtotal,
    total: subtotal,
  };
}

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { userId },
    include: cartInclude,
  });
}

async function loadProduct(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    select: CART_PRODUCT_SELECT,
  });
}

function parseQuantity(raw: unknown, fallback = 1): number | null {
  const quantity = Math.trunc(Number(raw));
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  return quantity;
}

function paramId(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return "";
}

/** GET /api/cart — current customer's cart with line totals. */
export const getCart = async (req: Request, res: Response) => {
  try {
    const cart = await getOrCreateCart(req.user!.userId);
    res.json(formatCart(cart));
  } catch (err) {
    console.error("[cart] getCart", err);
    res.status(500).json({ message: "Failed to load cart" });
  }
};

/** POST /api/cart/items — add a product or increase quantity. */
export const addCartItem = async (req: Request, res: Response) => {
  try {
    const productId =
      typeof req.body?.productId === "string" ? req.body.productId.trim() : "";
    const quantity = parseQuantity(req.body?.quantity, 1);

    if (!productId) {
      res.status(400).json({ message: "productId is required" });
      return;
    }
    if (quantity === null) {
      res.status(400).json({ message: "quantity must be at least 1" });
      return;
    }

    const product = await loadProduct(productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (!isProductPurchasable(product)) {
      res.status(400).json({ message: "Product is not available" });
      return;
    }

    const cart = await getOrCreateCart(req.user!.userId);
    const existing = cart.items.find((item) => item.productId === productId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (nextQuantity > product.stock) {
      res.status(400).json({
        message: `Only ${product.stock} in stock`,
      });
      return;
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    const updated = await getOrCreateCart(req.user!.userId);
    res.status(existing ? 200 : 201).json(formatCart(updated));
  } catch (err) {
    console.error("[cart] addCartItem", err);
    res.status(500).json({ message: "Failed to add item to cart" });
  }
};

/** PATCH /api/cart/items/:productId — set quantity (0 removes the line). */
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const productId = paramId(req.params.productId);
    const quantity = parseQuantity(req.body?.quantity, NaN);

    if (!productId) {
      res.status(400).json({ message: "productId is required" });
      return;
    }

    if (quantity === null) {
      res.status(400).json({ message: "quantity must be at least 1" });
      return;
    }

    const cart = await getOrCreateCart(req.user!.userId);
    const existing = cart.items.find((item) => item.productId === productId);

    if (!existing) {
      res.status(404).json({ message: "Item not in cart" });
      return;
    }

    const product = await loadProduct(productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (!isProductPurchasable(product)) {
      res.status(400).json({ message: "Product is not available" });
      return;
    }
    if (quantity > product.stock) {
      res.status(400).json({
        message: `Only ${product.stock} in stock`,
      });
      return;
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });

    const updated = await getOrCreateCart(req.user!.userId);
    res.json(formatCart(updated));
  } catch (err) {
    console.error("[cart] updateCartItem", err);
    res.status(500).json({ message: "Failed to update cart item" });
  }
};

/** DELETE /api/cart/items/:productId — remove a line item. */
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const productId = paramId(req.params.productId);
    const cart = await getOrCreateCart(req.user!.userId);
    const existing = cart.items.find((item) => item.productId === productId);

    if (!productId) {
      res.status(400).json({ message: "productId is required" });
      return;
    }

    if (!existing) {
      res.status(404).json({ message: "Item not in cart" });
      return;
    }

    await prisma.cartItem.delete({ where: { id: existing.id } });

    const updated = await getOrCreateCart(req.user!.userId);
    res.json(formatCart(updated));
  } catch (err) {
    console.error("[cart] removeCartItem", err);
    res.status(500).json({ message: "Failed to remove cart item" });
  }
};
