const REQUIRED = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
] as const;

export function validateEnv(): void {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error("JWT_SECRET and JWT_REFRESH_SECRET must be different values");
    process.exit(1);
  }

  if (
    (process.env.JWT_SECRET?.length ?? 0) < 32 ||
    (process.env.JWT_REFRESH_SECRET?.length ?? 0) < 32
  ) {
    console.error("JWT_SECRET and JWT_REFRESH_SECRET must be at least 32 characters");
    process.exit(1);
  }

  const hasBrevoKey = Boolean(process.env.BREVO_API_KEY?.trim());
  const hasBrevoSender = Boolean(process.env.BREVO_SENDER_EMAIL?.trim());
  if (hasBrevoKey !== hasBrevoSender) {
    console.warn(
      "[env] Order emails require both BREVO_API_KEY and BREVO_SENDER_EMAIL. Transactional emails will be skipped until both are set."
    );
  }
}
