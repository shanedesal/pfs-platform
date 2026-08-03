import { BrevoClient } from "@getbrevo/brevo";

let client: BrevoClient | null = null;

/** Brevo client; null when `BREVO_API_KEY` is not configured. */
export function getBrevoClient(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return null;

  if (!client) {
    client = new BrevoClient({ apiKey });
  }
  return client;
}

export function getEmailSender(): { name: string; email: string } | null {
  const email = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!email) return null;

  const name = process.env.BREVO_SENDER_NAME?.trim() || "PFS";
  return { name, email };
}

export function isEmailConfigured(): boolean {
  return getBrevoClient() !== null && getEmailSender() !== null;
}
