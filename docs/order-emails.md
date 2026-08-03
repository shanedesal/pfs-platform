# Order transactional emails (Brevo)

## Overview

The server sends transactional emails when certain order events occur:

| Event | Trigger | Recipient |
|-------|---------|-----------|
| Order completed | Admin sets status to `COMPLETED` | `order.email` (snapshot from checkout) |
| Order cancelled (customer) | Customer cancels a `PENDING` order | `order.email` |
| Order cancelled (admin) | Admin sets status to `CANCELLED` | `order.email` |

Emails are sent via [Brevo](https://developers.brevo.com/docs/getting-started). Sending is **non-blocking** — a failed or skipped email never fails the underlying order API call.

## Behavior / rules

### When emails are sent

- **Completed:** Fires once when an admin updates an order to `COMPLETED` and the previous status was not already `COMPLETED`.
- **Cancelled (customer):** Fires after a successful `PATCH /api/orders/:orderNumber/cancel` transaction. Confirms the customer's self-service cancellation.
- **Cancelled (admin):** Fires once when an admin updates an order to `CANCELLED` and the previous status was not already `CANCELLED`. The email explicitly states that an administrator cancelled the order.

### Configuration

These env vars must be set for emails to send:

| Variable | Purpose |
|----------|---------|
| `BREVO_API_KEY` | Brevo API key ([create one](https://app.brevo.com/settings/keys/api)) |
| `BREVO_SENDER_EMAIL` | Verified sender email in Brevo ([add sender](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email)) |
| `BREVO_SENDER_NAME` | Optional display name for the sender (defaults to `PFS`) |

If `BREVO_API_KEY` or `BREVO_SENDER_EMAIL` is missing, the server starts normally but skips sending (logs a warning in development).

Unlike domain-only providers, Brevo lets you verify an individual sender email (e.g. a Gmail address) with a 6-digit code — no custom domain required, though domain authentication improves deliverability.

### Error handling

- SDK/network errors are caught and logged; they are not thrown to the client.
- Order API responses succeed even when email delivery fails.

## Implementation

### Email module

```
server/src/services/email/
  client.ts         # Brevo client + env helpers
  templates.ts      # HTML email bodies
  order-emails.ts   # notifyOrderCompleted, notifyOrderCancelledByCustomer, notifyOrderCancelledByAdmin
  index.ts          # public exports
```

### Hook points

| Controller | Function | Email |
|------------|----------|-------|
| `server/src/controllers/admin-orders.controller.ts` | `updateAdminOrderStatus` | `notifyOrderCompleted` when status becomes `COMPLETED`; `notifyOrderCancelledByAdmin` when status becomes `CANCELLED` |
| `server/src/controllers/orders.controller.ts` | `cancelOrder` | `notifyOrderCancelledByCustomer` after successful cancel |

Recipient address is always the snapshotted `order.email` on the order row — no extra user lookup.

### Email templates

HTML templates in `templates.ts` use the same flat color tokens as `web/src/app/globals.css`:

| Token | Hex | Usage in emails |
|-------|-----|-----------------|
| `brand` | `#2D6CDF` | Header bar, order number, line totals, grand total |
| `ink` | `#0B1220` | Headings, primary text |
| `inkSoft` | `#131C2E` | Lead paragraph text |
| `paper` | `#F7F8FB` | Page background, order summary card |
| `paperSoft` | `#EEF1F6` | Borders and dividers |
| `slate` | `#64748B` | Labels, footer, secondary text |

No gradients or purple — matches the storefront design rules.

### Dependency

- `@getbrevo/brevo` npm package in `server/package.json`

## Changes

- Replaced Resend with Brevo for transactional order emails
- Added admin-cancellation email template and hook in `updateAdminOrderStatus`
- Switched env vars to `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and optional `BREVO_SENDER_NAME`
- Updated README env template and cross-referenced from customer/admin order docs
