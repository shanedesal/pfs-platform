import { Request, Response } from "express";
import { Prisma, ProductStatus } from "@prisma/client";
import prisma from "../config/db";

const SEARCH_MAX_Q = 100;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;
const PRODUCT_LIST_LIMIT = 48;

const PRODUCT_LIST_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  imageUrl: true,
  status: true,
  category: { select: { id: true, name: true } },
} as const;

type SortKey = "newest" | "price-asc" | "price-desc";

function mapProductPrices<T extends { price: { toString(): string } | number }>(
  products: T[]
) {
  return products.map((product) => ({
    ...product,
    price: Number(product.price),
  }));
}

function parsePage(raw: unknown): number {
  return Math.max(1, Math.trunc(Number(raw)) || 1);
}

function parsePageSize(raw: unknown): number {
  return Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(Number(raw)) || DEFAULT_PAGE_SIZE)
  );
}

function parseSort(raw: unknown): SortKey {
  if (raw === "price-asc" || raw === "price-desc" || raw === "newest") {
    return raw;
  }
  return "newest";
}

function orderByForSort(sort: SortKey): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price-asc") return { price: "asc" };
  if (sort === "price-desc") return { price: "desc" };
  return { createdAt: "desc" };
}

/** Public storefront catalog — search, category filter, sort, pagination. */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parsePage(req.query.page);
    const pageSize = parsePageSize(req.query.pageSize);
    const sort = parseSort(req.query.sort);
    const q =
      typeof req.query.q === "string"
        ? req.query.q.trim().slice(0, SEARCH_MAX_Q)
        : "";
    const categoryId =
      typeof req.query.categoryId === "string" ? req.query.categoryId.trim() : "";

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
    }

    const where: Prisma.ProductWhereInput = {
      status: { not: ProductStatus.INACTIVE },
    };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: PRODUCT_LIST_SELECT,
        orderBy: orderByForSort(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      items: mapProductPrices(items),
      total,
      page,
      pageSize,
      sort,
      q: q || undefined,
      categoryId: categoryId || undefined,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
};

/** Public single product for the storefront detail page. */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ message: "Invalid id parameter" });
      return;
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        status: { not: ProductStatus.INACTIVE },
      },
      select: {
        ...PRODUCT_LIST_SELECT,
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, url: true, sortOrder: true },
        },
      },
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({
      ...product,
      price: Number(product.price),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product", error });
  }
};

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
      where: {
        categoryId,
        status: { not: ProductStatus.INACTIVE },
      },
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
        status: { not: ProductStatus.INACTIVE },
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
