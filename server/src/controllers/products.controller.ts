import { Request, Response } from "express";
import prisma from "../config/db";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;
    const product = await prisma.product.create({
      data: { name, description, price, stock, imageUrl },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error });
  }
};