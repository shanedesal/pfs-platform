import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { Prisma, ProductStatus } from "@prisma/client";
import prisma from "../config/db";
import { supabase, SUPABASE_STORAGE_BUCKET, isSupabaseConfigured } from "../config/supabase";

const SEARCH_MAX_Q = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
/** Keep in sync with PRODUCT_DESCRIPTION_MAX_LENGTH in web/src/lib/product.ts. */
const DESCRIPTION_MAX_LENGTH = 4000;

const PRODUCT_STATUSES = new Set<string>(Object.values(ProductStatus));

const ADMIN_PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

function serializeProduct<T extends { price: { toString(): string } | number }>(product: T) {
  return { ...product, price: Number(product.price) };
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

/** Parses the `images` (gallery) field from a request body; undefined = "leave unchanged". */
function parseGalleryUrls(input: unknown): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) return [];
  return input
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .map((url) => url.trim());
}

/** Admin product list — search, category/status filters, pagination. */
export const listAdminProducts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Math.trunc(Number(req.query.page)) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(Number(req.query.pageSize)) || DEFAULT_PAGE_SIZE)
    );
    const search =
      typeof req.query.search === "string" ? req.query.search.trim().slice(0, SEARCH_MAX_Q) : "";
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId.trim() : "";
    const statusParam = typeof req.query.status === "string" ? req.query.status.trim() : "";

    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (statusParam && PRODUCT_STATUSES.has(statusParam)) {
      where.status = statusParam as ProductStatus;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      items: items.map(serializeProduct),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
};

/** Single product (with gallery) for the edit form. */
export const getAdminProduct = async (req: Request, res: Response) => {
  try {
    const id = requireIdParam(req, res);
    if (!id) return;

    const product = await prisma.product.findUnique({
      where: { id },
      include: ADMIN_PRODUCT_INCLUDE,
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json(serializeProduct(product));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product", error });
  }
};

export const createAdminProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, imageUrl, categoryId, status, images } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "name is required" });
      return;
    }
    if (typeof imageUrl !== "string" || !imageUrl.trim()) {
      res.status(400).json({ message: "imageUrl is required" });
      return;
    }
    if (typeof description === "string" && description.trim().length > DESCRIPTION_MAX_LENGTH) {
      res.status(400).json({ message: `description must be at most ${DESCRIPTION_MAX_LENGTH} characters` });
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      res.status(400).json({ message: "price must be a non-negative number" });
      return;
    }
    const stockNum = Number(stock);
    if (stock !== undefined && (!Number.isFinite(stockNum) || stockNum < 0)) {
      res.status(400).json({ message: "stock must be a non-negative number" });
      return;
    }
    if (status !== undefined && !PRODUCT_STATUSES.has(status)) {
      res.status(400).json({ message: "status must be one of ACTIVE, INACTIVE, OUT_OF_STOCK" });
      return;
    }
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        res.status(400).json({ message: "categoryId does not exist" });
        return;
      }
    }

    const galleryUrls = parseGalleryUrls(images) ?? [];

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: name.trim(),
          description: typeof description === "string" ? description.trim() || null : null,
          price: priceNum,
          stock: Number.isFinite(stockNum) ? Math.trunc(stockNum) : 0,
          imageUrl: imageUrl.trim(),
          status: (status as ProductStatus) ?? ProductStatus.ACTIVE,
          categoryId: categoryId || null,
        },
      });

      if (galleryUrls.length > 0) {
        await tx.productImage.createMany({
          data: galleryUrls.map((url, index) => ({ productId: created.id, url, sortOrder: index })),
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: ADMIN_PRODUCT_INCLUDE,
      });
    });

    res.status(201).json(serializeProduct(product));
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error });
  }
};

export const updateAdminProduct = async (req: Request, res: Response) => {
  try {
    const id = requireIdParam(req, res);
    if (!id) return;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const { name, description, price, stock, imageUrl, categoryId, status, images } = req.body;
    const data: Prisma.ProductUpdateInput = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({ message: "name must be a non-empty string" });
        return;
      }
      data.name = name.trim();
    }
    if (description !== undefined) {
      if (typeof description === "string" && description.trim().length > DESCRIPTION_MAX_LENGTH) {
        res.status(400).json({ message: `description must be at most ${DESCRIPTION_MAX_LENGTH} characters` });
        return;
      }
      data.description = typeof description === "string" ? description.trim() || null : null;
    }
    if (price !== undefined) {
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        res.status(400).json({ message: "price must be a non-negative number" });
        return;
      }
      data.price = priceNum;
    }
    if (stock !== undefined) {
      const stockNum = Number(stock);
      if (!Number.isFinite(stockNum) || stockNum < 0) {
        res.status(400).json({ message: "stock must be a non-negative number" });
        return;
      }
      data.stock = Math.trunc(stockNum);
    }
    if (imageUrl !== undefined) {
      if (typeof imageUrl !== "string" || !imageUrl.trim()) {
        res.status(400).json({ message: "imageUrl must be a non-empty string" });
        return;
      }
      data.imageUrl = imageUrl.trim();
    }
    if (status !== undefined) {
      if (typeof status !== "string" || !PRODUCT_STATUSES.has(status)) {
        res.status(400).json({ message: "status must be one of ACTIVE, INACTIVE, OUT_OF_STOCK" });
        return;
      }
      data.status = status as ProductStatus;
    }
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) {
          res.status(400).json({ message: "categoryId does not exist" });
          return;
        }
        data.category = { connect: { id: categoryId } };
      } else {
        data.category = { disconnect: true };
      }
    }

    const galleryUrls = parseGalleryUrls(images);

    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });

      if (galleryUrls !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (galleryUrls.length > 0) {
          await tx.productImage.createMany({
            data: galleryUrls.map((url, index) => ({ productId: id, url, sortOrder: index })),
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: ADMIN_PRODUCT_INCLUDE,
      });
    });

    res.json(serializeProduct(product));
  } catch (error) {
    res.status(500).json({ message: "Failed to update product", error });
  }
};

export const deleteAdminProduct = async (req: Request, res: Response) => {
  try {
    const id = requireIdParam(req, res);
    if (!id) return;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error });
  }
};

/** Uploads one image (cover or gallery) to Supabase Storage and returns its public URL. */
export const uploadProductImage = async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      res.status(500).json({
        message:
          "Image storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.",
      });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "image file is required" });
      return;
    }

    const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `products/${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      res.status(500).json({ message: "Failed to upload image", error: uploadError.message });
      return;
    }

    const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
    res.status(201).json({ url: data.publicUrl });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload image", error });
  }
};
