import type { OrderWithItems } from "../../utils/order-formatting";
import { getBrevoClient, getEmailSender, isEmailConfigured } from "./client";
import {
  orderCancelledByAdminEmail,
  orderCancelledByCustomerEmail,
  orderCompletedEmail,
} from "./templates";

async function sendEmail(params: {
  to: string;
  toName: string;
  subject: string;
  html: string;
  logLabel: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[email] Skipping ${params.logLabel} — BREVO_API_KEY or BREVO_SENDER_EMAIL not set`
      );
    }
    return;
  }

  const brevo = getBrevoClient()!;
  const sender = getEmailSender()!;

  const result = await brevo.transactionalEmails.sendTransacEmail({
    sender,
    to: [{ email: params.to, name: params.toName }],
    subject: params.subject,
    htmlContent: params.html,
    tags: [params.logLabel],
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`[email] Sent ${params.logLabel} (id: ${result.messageId ?? "unknown"})`);
  }
}

/** Fire-and-forget wrapper — email failures must not fail order operations. */
export function notifyOrderCompleted(order: OrderWithItems): void {
  const { subject, html } = orderCompletedEmail(order);
  void sendEmail({
    to: order.email,
    toName: order.customerName,
    subject,
    html,
    logLabel: "order-completed",
  }).catch((err) => {
    console.error("[email] Failed to send order-completed", err);
  });
}

/** Fire-and-forget wrapper — email failures must not fail order operations. */
export function notifyOrderCancelledByCustomer(order: OrderWithItems): void {
  const { subject, html } = orderCancelledByCustomerEmail(order);
  void sendEmail({
    to: order.email,
    toName: order.customerName,
    subject,
    html,
    logLabel: "order-cancelled-customer",
  }).catch((err) => {
    console.error("[email] Failed to send order-cancelled-customer", err);
  });
}

/** Fire-and-forget wrapper — email failures must not fail order operations. */
export function notifyOrderCancelledByAdmin(order: OrderWithItems): void {
  const { subject, html } = orderCancelledByAdminEmail(order);
  void sendEmail({
    to: order.email,
    toName: order.customerName,
    subject,
    html,
    logLabel: "order-cancelled-admin",
  }).catch((err) => {
    console.error("[email] Failed to send order-cancelled-admin", err);
  });
}
