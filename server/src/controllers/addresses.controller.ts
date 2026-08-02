import { Request, Response } from "express";
import prisma from "../config/db";

const MAX_ADDRESSES_PER_USER = 10;
const POSTAL_CODE_RE = /^\d{4}$/;

function paramId(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return "";
}

function trimString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

function trimOptionalString(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return undefined;
  return trimmed || null;
}

type ParsedAddressInput = {
  label: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string | null;
};

/** Validates and normalizes address fields shared by create/update. Returns an error message on failure. */
function parseAddressInput(body: unknown): ParsedAddressInput | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;

  const addressLine1 = trimString(b.addressLine1, 200);
  if (!addressLine1) return { error: "Street address is required" };

  const addressLine2 = trimString(b.addressLine2, 200);
  if (!addressLine2) return { error: "Barangay is required" };

  const city = trimString(b.city, 100);
  if (!city) return { error: "City is required" };

  const province = trimString(b.province, 100);
  if (!province) return { error: "Province is required" };

  const label = trimOptionalString(b.label, 30);
  if (label === undefined) return { error: "Label is too long" };

  let postalCode: string | null = null;
  if (b.postalCode !== undefined && b.postalCode !== null && b.postalCode !== "") {
    if (typeof b.postalCode !== "string" || !POSTAL_CODE_RE.test(b.postalCode.trim())) {
      return { error: "Postal code must be 4 digits" };
    }
    postalCode = b.postalCode.trim();
  }

  return {
    label,
    addressLine1,
    addressLine2,
    city,
    province,
    postalCode,
  };
}

function formatAddress(address: {
  id: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: Date;
}) {
  return {
    id: address.id,
    label: address.label,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
  };
}

/** GET /api/addresses — list the signed-in user's saved addresses (default first). */
export const listAddresses = async (req: Request, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    res.json(addresses.map(formatAddress));
  } catch (error) {
    console.error("[addresses] list", error);
    res.status(500).json({ message: "Failed to load addresses" });
  }
};

/** POST /api/addresses — add a new address. First address (or isDefault: true) becomes the default. */
export const createAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const parsed = parseAddressInput(req.body);
    if ("error" in parsed) {
      res.status(400).json({ message: parsed.error });
      return;
    }

    const existingCount = await prisma.address.count({ where: { userId } });
    if (existingCount >= MAX_ADDRESSES_PER_USER) {
      res
        .status(400)
        .json({ message: `You can save up to ${MAX_ADDRESSES_PER_USER} addresses` });
      return;
    }

    const requestedDefault = req.body?.isDefault === true;
    const shouldBeDefault = requestedDefault || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: { ...parsed, userId, isDefault: shouldBeDefault },
      });
    });

    res.status(201).json(formatAddress(address));
  } catch (error) {
    console.error("[addresses] create", error);
    res.status(500).json({ message: "Failed to save address" });
  }
};

/** PUT /api/addresses/:id — update an address. Pass isDefault: true to make it the default. */
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = paramId(req.params.id);
    if (!id) {
      res.status(400).json({ message: "Invalid address id" });
      return;
    }

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const parsed = parseAddressInput(req.body);
    if ("error" in parsed) {
      res.status(400).json({ message: parsed.error });
      return;
    }

    const makeDefault = req.body?.isDefault === true && !existing.isDefault;

    const address = await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: { ...parsed, isDefault: makeDefault ? true : existing.isDefault },
      });
    });

    res.json(formatAddress(address));
  } catch (error) {
    console.error("[addresses] update", error);
    res.status(500).json({ message: "Failed to update address" });
  }
};

/** PATCH /api/addresses/:id/default — make this address the default, demoting any other. */
export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = paramId(req.params.id);
    if (!id) {
      res.status(400).json({ message: "Invalid address id" });
      return;
    }

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const address = await prisma.$transaction(async (tx) => {
      if (!existing.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    res.json(formatAddress(address));
  } catch (error) {
    console.error("[addresses] setDefault", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};

/** DELETE /api/addresses/:id — remove an address. Promotes the oldest remaining one if the default was removed. */
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = paramId(req.params.id);
    if (!id) {
      res.status(400).json({ message: "Invalid address id" });
      return;
    }

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });
        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    res.status(204).end();
  } catch (error) {
    console.error("[addresses] delete", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
};
