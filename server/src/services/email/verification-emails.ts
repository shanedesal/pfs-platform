import { getAppUrl } from "../../utils/app-url";
import { getBrevoClient, getEmailSender, isEmailConfigured } from "./client";
import { emailVerificationEmail } from "./templates";

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

export function sendRegistrationVerificationEmail(params: {
  email: string;
  name: string;
  token: string;
}): void {
  const verifyUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(params.token)}`;
  const { subject, html } = emailVerificationEmail({ name: params.name, verifyUrl });

  void sendEmail({
    to: params.email,
    toName: params.name,
    subject,
    html,
    logLabel: "email-verification",
  }).catch((err) => {
    console.error("[email] Failed to send email-verification", err);
  });
}
