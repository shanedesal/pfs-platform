import { PaymentMethod } from "@prisma/client";
import type { OrderWithItems } from "../../utils/order-formatting";

/** Mirrors `web/src/app/globals.css` @theme tokens (flat colors only). */
const COLORS = {
  brand: "#2D6CDF",
  brandDark: "#1E4FB8",
  ink: "#0B1220",
  inkSoft: "#131C2E",
  paper: "#F7F8FB",
  paperSoft: "#EEF1F6",
  slate: "#64748B",
  white: "#FFFFFF",
} as const;

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Cash on Delivery",
  E_WALLET: "E-Wallet",
  BANK_TRANSFER: "Bank Transfer",
};

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderLineItems(order: OrderWithItems): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${COLORS.paperSoft};color:${COLORS.ink};">${escapeHtml(item.productName)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${COLORS.paperSoft};text-align:center;color:${COLORS.ink};">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${COLORS.paperSoft};text-align:right;font-family:ui-monospace,monospace;color:${COLORS.brand};">${formatMoney(Number(item.lineTotal))}</td>
      </tr>`
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="color:${COLORS.slate};">
          <th align="left" style="padding-bottom:10px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Item</th>
          <th align="center" style="padding-bottom:10px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Qty</th>
          <th align="right" style="padding-bottom:10px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.paper};font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:${COLORS.ink};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.paper};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.white};border-radius:16px;border:1px solid ${COLORS.paperSoft};overflow:hidden;">
          <tr>
            <td style="background:${COLORS.brand};padding:20px 32px;">
              <p style="margin:0 0 4px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Products For Sale</p>
              <p style="margin:0;font-size:20px;font-weight:600;color:${COLORS.white};">PFS</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:${COLORS.slate};">This is an automated message. Please do not reply.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function orderSummaryBlock(order: OrderWithItems): string {
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;background:${COLORS.paper};border-radius:12px;border:1px solid ${COLORS.paperSoft};">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:${COLORS.slate};">Order number</p>
          <p style="margin:0 0 16px;font-family:ui-monospace,monospace;font-size:16px;font-weight:600;color:${COLORS.brand};">${escapeHtml(order.orderNumber)}</p>
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:${COLORS.slate};">Placed on</p>
          <p style="margin:0 0 20px;font-size:14px;color:${COLORS.ink};">${formatDate(order.createdAt.toISOString())}</p>
          ${renderLineItems(order)}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid ${COLORS.paperSoft};">
            <tr>
              <td style="padding-top:16px;text-align:right;font-size:16px;font-weight:600;color:${COLORS.ink};">Total</td>
              <td style="padding-top:16px;text-align:right;font-family:ui-monospace,monospace;font-size:18px;font-weight:600;color:${COLORS.brand};width:120px;">${formatMoney(Number(order.total))}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:8px;text-align:right;font-size:13px;color:${COLORS.slate};">Payment: ${escapeHtml(paymentLabel)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:${COLORS.ink};">${text}</h1>`;
}

function emailLead(text: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${COLORS.inkSoft};">${text}</p>`;
}

function emailFooter(text: string): string {
  return `<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${COLORS.slate};">${text}</p>`;
}

export function orderCompletedEmail(order: OrderWithItems): { subject: string; html: string } {
  const name = escapeHtml(order.customerName);
  const body = `
    ${emailHeading("Your order is complete")}
    ${emailLead(`Hi ${name}, thanks for shopping with us. Your order has been marked as completed.`)}
    ${orderSummaryBlock(order)}
    ${emailFooter("We hope you enjoy your purchase. You can view this order anytime in your account.")}`;

  return {
    subject: `Order ${order.orderNumber} completed`,
    html: emailLayout(`Order ${order.orderNumber} completed`, body),
  };
}

export function orderCancelledByCustomerEmail(order: OrderWithItems): { subject: string; html: string } {
  const name = escapeHtml(order.customerName);
  const body = `
    ${emailHeading("Order cancelled")}
    ${emailLead(`Hi ${name}, your cancellation request for the order below was successful. Reserved stock has been released and you will not be charged for this order.`)}
    ${orderSummaryBlock(order)}
    ${emailFooter("If you did not request this cancellation, please contact us right away.")}`;

  return {
    subject: `Order ${order.orderNumber} cancelled`,
    html: emailLayout(`Order ${order.orderNumber} cancelled`, body),
  };
}

export function orderCancelledByAdminEmail(order: OrderWithItems): { subject: string; html: string } {
  const name = escapeHtml(order.customerName);
  const body = `
    ${emailHeading("Order cancelled by our team")}
    ${emailLead(`Hi ${name}, an administrator has cancelled your order. This was not a self-service cancellation — our team made this change on your behalf.`)}
    ${orderSummaryBlock(order)}
    ${emailFooter("If you have questions about this cancellation, please contact us.")}`;

  return {
    subject: `Order ${order.orderNumber} cancelled by admin`,
    html: emailLayout(`Order ${order.orderNumber} cancelled by admin`, body),
  };
}

export function emailVerificationEmail(params: {
  name: string;
  verifyUrl: string;
}): { subject: string; html: string } {
  const name = escapeHtml(params.name);
  const verifyUrl = escapeHtml(params.verifyUrl);
  const body = `
    ${emailHeading("Verify your email")}
    ${emailLead(`Hi ${name}, thanks for signing up for PFS. Confirm your email address to finish creating your account.`)}
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="border-radius:9999px;background:${COLORS.brand};">
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:${COLORS.white};text-decoration:none;">Verify email</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${COLORS.slate};">Or copy this link into your browser:</p>
    <p style="margin:0;font-size:13px;line-height:1.6;word-break:break-all;color:${COLORS.brand};">${verifyUrl}</p>
    ${emailFooter("This link expires in 24 hours. If you did not create an account, you can ignore this email.")}`;

  return {
    subject: "Verify your PFS account",
    html: emailLayout("Verify your PFS account", body),
  };
}
