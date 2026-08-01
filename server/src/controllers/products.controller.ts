import { Request, Response } from "express";
import prisma from "../config/db";

const SEARCH_MAX_Q = 100;

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
};

const PRODUCT_LIST_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  imageUrl: true,
} as const;

const PRODUCT_LIST_LIMIT = 48;

function mapProductPrices<T extends { price: { toString(): string } | number }>(
  products: T[]
) {
  return products.map((product) => ({
    ...product,
    price: Number(product.price),
  }));
}

/** Public products filtered by category (no auth). */
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId =
      typeof req.query.categoryId === "string" ? req.query.categoryId.trim() : "";

    if (!categoryId) {
      res.status(400).json({ message: "Query parameter categoryId is required" });
      return;
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    const products = await prisma.product.findMany({
      where: { categoryId },
      take: PRODUCT_LIST_LIMIT,
      orderBy: { createdAt: "desc" },
      select: PRODUCT_LIST_SELECT,
    });

    res.json({
      category,
      products: mapProductPrices(products),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products by category", error });
  }
};

/** Public product search by name/description (no auth). */
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const raw = typeof req.query.q === "string" ? req.query.q : "";
    const q = raw.trim().slice(0, SEARCH_MAX_Q);

    if (!q) {
      res.status(400).json({ message: "Query parameter q is required" });
      return;
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: PRODUCT_LIST_LIMIT,
      orderBy: { createdAt: "desc" },
      select: PRODUCT_LIST_SELECT,
    });

    res.json({
      q,
      products: mapProductPrices(products),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to search products", error });
  }
};
