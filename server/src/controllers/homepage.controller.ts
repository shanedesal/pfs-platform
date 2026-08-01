import { Request, Response } from "express";
import prisma from "../config/db";

/** Featured products for the storefront homepage (not a general catalog API). */
export const getHomepageFeatured = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
      },
    });

    res.json(
      products.map((product) => ({
        ...product,
        price: Number(product.price),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch homepage featured products", error });
  }
};
