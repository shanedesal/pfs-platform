import { apiFetch } from "./api";

type VerifyEmailResult = {
  ok: boolean;
  status: number;
  data: {
    id?: string;
    email?: string;
    name?: string;
    phoneNumber?: string | null;
    role?: "ADMIN" | "CUSTOMER";
    message?: string;
    code?: string;
  };
};

/** Cached per token for the lifetime of the page — avoids duplicate API calls on Strict Mode remounts. */
const verifyRequests = new Map<string, Promise<VerifyEmailResult>>();

export function verifyEmailOnce(token: string): Promise<VerifyEmailResult> {
  const existing = verifyRequests.get(token);
  if (existing) return existing;

  const request = (async (): Promise<VerifyEmailResult> => {
    const res = await apiFetch("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  })();

  verifyRequests.set(token, request);
  return request;
}

export async function resendVerificationEmail(email: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const res = await apiFetch("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return {
    ok: res.ok,
    message: data.message || "Failed to resend verification email",
  };
}

/** Read token from the URL reliably (searchParams can lag on first client paint). */
export function getVerificationTokenFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
}
