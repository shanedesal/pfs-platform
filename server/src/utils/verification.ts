import { createHash, randomBytes } from "crypto";

export const VERIFICATION_TOKEN_BYTES = 32;
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function generateVerificationToken(): string {
  return randomBytes(VERIFICATION_TOKEN_BYTES).toString("hex");
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verificationExpiresAt(from = Date.now()): Date {
  return new Date(from + VERIFICATION_TTL_MS);
}
