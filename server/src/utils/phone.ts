// Philippine mobile numbers: 11 digits starting with "09", e.g. 0912 234 2345.
const PH_MOBILE_RE = /^09\d{9}$/;

/** Accepts digits with optional spaces/dashes; normalizes to "0912 234 2345". Returns null if invalid. */
export function normalizePhoneNumber(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  if (!PH_MOBILE_RE.test(digits)) return null;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
}
