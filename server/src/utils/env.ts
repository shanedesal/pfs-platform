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
}
