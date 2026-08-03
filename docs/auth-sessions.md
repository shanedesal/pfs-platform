# Auth sessions (access + refresh cookies)

## Overview

PFS authenticates users with httpOnly cookies: a short-lived access token and a longer-lived refresh token. Refresh tokens are rotated on each successful refresh; hashes are stored in PostgreSQL. This doc covers session lifecycle, refresh concurrency, reuse detection, and rate limits.

## Behavior / rules

| Rule | Detail |
|------|--------|
| Access cookie | `accessToken`, ~15m, httpOnly; `sameSite=strict` in development; `sameSite=none` + `secure` in production (required for cross-origin Render/Vercel deploys) |
| Refresh cookie | `refreshToken`, ~7d; same cookie flags as access; JWT signed with `JWT_REFRESH_SECRET`; SHA-256 hash stored in `RefreshToken` |
| Rotation | Successful `POST /api/auth/refresh` atomically claims (revokes) the presented token, then issues a new pair |
| Concurrent refresh | Only one request can claim a given token (`updateMany` where `revokedAt` is null). Losers receive `401` without wiping other sessions if the token was revoked within a **30s grace** window |
| Reuse / theft | Presenting a refresh token that was revoked **more than 30s ago** revokes all remaining refresh tokens for that user |
| Missing / expired / mismatched | `401` only — no mass revoke |
| Client single-flight | `authFetch` shares one in-flight refresh promise so parallel `401`s do not stampede `/refresh` |
| Rate limits | Login: 5 failed / 15m / IP; Register: 10 / hour / IP; Refresh: 30 / 15m / IP; Logout: 60 / 15m / IP |
| Disabled accounts | `authenticate` loads `User.isActive` on every request and returns `401` if false, even with a still-valid access token; `login` returns `403` for a disabled account. See [`docs/customer-management.md`](./customer-management.md) |
| Email verification | New signups must verify email before a `User` is created; see [`docs/auth-email-verification.md`](./auth-email-verification.md). Existing/seed accounts are backfilled as verified. Rate limits on register, resend, and verify endpoints. |

### Endpoints

| Method | Path | Auth | Limiter |
|--------|------|------|---------|
| POST | `/api/auth/register` | Public | `registerLimiter` — creates pending registration, sends verification email (`202`, no session) |
| POST | `/api/auth/verify-email` | Public | — — completes signup after email link |
| POST | `/api/auth/resend-verification` | Public | `resendVerificationLimiter` |
| POST | `/api/auth/login` | Public | `loginLimiter` |
| POST | `/api/auth/refresh` | Refresh cookie | `refreshLimiter` |
| POST | `/api/auth/logout` | Optional refresh cookie | `logoutLimiter` |
| GET | `/api/auth/me` | Access cookie (`authenticate`) | — |

## Implementation

- **Server refresh:** `server/src/controllers/auth.controller.ts` — atomic claim + grace-window reuse detection
- **Token helpers:** `server/src/utils/tokens.ts`, `server/src/utils/jwt.ts`
- **Rate limits:** `server/src/middleware/rateLimiter.ts`, wired in `server/src/routes/auth.ts`
- **Client:** `web/src/lib/api.ts` (`authFetch` + single-flight refresh), `web/src/lib/auth-context.tsx`

### Refresh flow (happy path)

1. Verify refresh JWT.
2. `updateMany` claim: matching `tokenHash`, `userId`, `revokedAt: null`, `expiresAt > now`.
3. If `count === 1`, load user role from DB, `issueTokenPair`, set cookies.
4. If claim fails, look up row; mass-revoke only when `revokedAt` is older than 30s (likely theft, not a race).

## Changes

- Atomic refresh token claim to prevent double-rotation races.
- 30s grace before treating revoked-token replay as theft (avoids multi-tab / parallel refresh logging everyone out).
- Frontend single-flight refresh for parallel `authFetch` callers.
- Rate limit on `POST /api/auth/logout` (60 / 15 minutes / IP).
- `authenticate` and `login` now reject disabled accounts (`User.isActive`); see [`docs/customer-management.md`](./customer-management.md).
