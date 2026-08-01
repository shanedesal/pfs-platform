import { createHash, randomUUID } from "crypto";
import prisma from "../config/db";
import { signAccessToken, signRefreshToken, JwtPayload } from "./jwt";

const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueTokenPair(payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const jti = randomUUID();
  const refreshToken = signRefreshToken({ ...payload, jti });

  await prisma.refreshToken.create({
    data: {
      id: jti,
      tokenHash: hashToken(refreshToken),
      userId: payload.userId,
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_MS),
    },
  });

  return { accessToken, refreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
