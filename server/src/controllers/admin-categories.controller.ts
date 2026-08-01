import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";

type CategoryWithCount = Prisma.CategoryGetPayload<{ include: { _count: { select: { products: true } } } }>;

function serializeCategory({ _count, ...category }: CategoryWithCount) {
  return { ...category, productCount: _count.products };
}

/** Express 5 route params can be `string | string[] | undefined`; narrow to a single id. */
function requireIdParam(req: Request, res: Response): string | null {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid id parameter" });
    return null;
  }
  return id;
}

/** Admin category list, newest-sorted-first by sortOrder, with product counts for the delete guard. */
export const listAdminCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });

    res.json(categories.map(serializeCategory));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error });
  }
};

export const createAdminCategory = async (req: Request, res: Response) => {
  try {
    const { name, sortOrder } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "name is required" });
      return;
    }

    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      res.status(409).json({ message: "A category with this name already exists" });
      return;
    }

    const sortOrderNum = Number(sortOrder);

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        sortOrder: Number.isFinite(sortOrderNum) ? Math.trunc(sortOrderNum) : 0,
      },
      include: { _count: { select: { products: true } } },
    });

    res.status(201).json(serializeCategory(category));
  } catch (error) {
    res.status(500).json({ message: "Failed to create category", error });
  }
};

export const updateAdminCategory = async (req: Request, res: Response) => {
  try {
    const id = requireIdParam(req, res);
    if (!id) return;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    const { name, sortOrder } = req.body;
    const data: Prisma.CategoryUpdateInput = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({ message: "name must be a non-empty string" });
        return;
      }
      const duplicate = await prisma.category.findUnique({ where: { name: name.trim() } });
      if (duplicate && duplicate.id !== id) {
        res.status(409).json({ message: "A category with this name already exists" });
        return;
      }
      data.name = name.trim();
    }
    if (sortOrder !== undefined) {
      const sortOrderNum = Number(sortOrder);
      if (!Number.isFinite(sortOrderNum)) {
        res.status(400).json({ message: "sortOrder must be a number" });
        return;
      }
      data.sortOrder = Math.trunc(sortOrderNum);
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    });

    res.json(serializeCategory(category));
  } catch (error) {
    res.status(500).json({ message: "Failed to update category", error });
  }
};

/** Hard-blocks deletion while any product still references this category. */
export const deleteAdminCategory = async (req: Request, res: Response) => {
  try {
    const id = requireIdParam(req, res);
    if (!id) return;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      res.status(409).json({
        message: `Cannot delete "${existing.name}": ${productCount} product${
          productCount === 1 ? " is" : "s are"
        } assigned to this category.`,
        productCount,
      });
      return;
    }

    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category", error });
  }
};
