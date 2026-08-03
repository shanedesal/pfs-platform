# Email verification at registration

## Overview

New customers must verify their email before an account is created. Signup stores details in a temporary `PendingRegistration` row, sends a Brevo verification email, and only creates a `User` after the link is clicked.

Existing seed/test accounts (`admin@example.com`, `customer@example.com`) were backfilled as already verified — they can log in without any extra step.

## Behavior / rules

### Registration flow

1. Customer submits name, email, and password on `/register`.
2. Server rejects if a `User` already exists with that email (`409`).
3. Server upserts `PendingRegistration` (refreshes token if they sign up again before verifying).
4. Server sends a verification email with a link to `/verify-email?token=...` (24-hour expiry).
5. API returns `202` — **no session cookies** are issued yet.
6. Frontend redirects to `/register/check-email`.

### Verification

1. Customer opens the link → `/verify-email` calls `POST /api/auth/verify-email` with the token.
2. Server validates token hash + expiry, creates `User` with `emailVerified: true`, deletes the pending row.
3. Server issues auth cookies (auto sign-in) and redirects home.

### Login before verification

- No `User` row exists yet → login with correct pending credentials returns `403` with `code: "EMAIL_NOT_VERIFIED"`.
- Frontend sends the customer to `/register/check-email` to resend the link.

### Resend

`POST /api/auth/resend-verification` with `{ email }` — rate limited (5/hour/IP). Always returns a generic success message whether or not a pending registration exists.

### Rate limits (anti-spam)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/register` | 10 requests | 1 hour / IP (each attempt sends or refreshes verification email) |
| `POST /api/auth/resend-verification` | 5 requests | 1 hour / IP |
| `POST /api/auth/verify-email` | 30 requests | 15 minutes / IP |

### Existing users

Migration `20260803120000_email_verification` sets `emailVerified = true` and `emailVerifiedAt = now()` for **all existing users**. Seed upserts also force verified status on demo accounts.

## Implementation

### Schema

- `User.emailVerified` (`Boolean`, default `false`) + `User.emailVerifiedAt`
- `PendingRegistration` — `email`, `name`, `password` (bcrypt hash), `tokenHash`, `expiresAt`

### API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create/refresh pending registration, send email (`202`) |
| POST | `/api/auth/verify-email` | `{ token }` — create user, sign in |
| POST | `/api/auth/resend-verification` | Resend link for pending email |

`login`, `refresh`, `authenticate`, and `/me` reject unverified users.

### Email

- Template: `emailVerificationEmail()` in `server/src/services/email/templates.ts`
- Sender: `sendRegistrationVerificationEmail()` in `verification-emails.ts`
- Link base URL: `APP_URL` env, else first `CORS_ORIGIN` entry, else `http://localhost:3000`

### Frontend

- `/register` — submits signup, redirects to check-email on `202`
- `/register/check-email` — instructions + resend button
- `/verify-email` — consumes token from query string, auto sign-in on success
- `/login` — redirects unverified users to check-email

### Files

- `server/prisma/schema.prisma`, migration `20260803120000_email_verification`
- `server/src/controllers/auth.controller.ts`
- `server/src/utils/verification.ts`, `server/src/utils/app-url.ts`
- `server/src/services/email/verification-emails.ts`
- `web/src/app/register/page.tsx`, `register/check-email/page.tsx`, `verify-email/page.tsx`

## Changes

- Added email verification gate before account creation (`PendingRegistration` + Brevo email)
- Backfilled existing users as verified; seed accounts stay verified
- New verify/resend auth endpoints and frontend pages
- Login/refresh/middleware block unverified access
