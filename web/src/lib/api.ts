/**
 * Browser requests use same-origin `/api/*` (proxied by Next.js rewrites) so httpOnly
 * auth cookies stay first-party — required for Safari/iOS, which blocks cross-site
 * cookies between pfs-web and pfs-api on Render even with SameSite=None.
 */
function apiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
}

/** @deprecated Prefer relative paths; browser calls are same-origin via Next.js rewrites. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const isDev = process.env.NODE_ENV === "development";

function logApi(direction: "→" | "←", method: string, path: string, status?: number) {
  if (!isDev) return;
  if (status === undefined) {
    console.log(`[api] ${direction} ${method} ${path}`);
  } else {
    console.log(`[api] ${direction} ${method} ${path} ${status}`);
  }
}

/** Shared fetch for backend endpoints. Logs method/path (and status) in development only. */
export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const method = (options?.method ?? "GET").toUpperCase();
  logApi("→", method, path);

  const headers = new Headers(options?.headers);
  // String bodies are assumed JSON; FormData/Blob keep browser Content-Type defaults.
  if (typeof options?.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${apiBase()}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  logApi("←", method, path, res.status);
  return res;
}

/** In-flight refresh shared across parallel authFetch callers (single-flight). */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const res = await apiFetch("/api/auth/refresh", { method: "POST" });
      return res.ok;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function authFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const res = await apiFetch(path, options);

  if (res.status === 401 && path !== "/api/auth/refresh") {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, options);
    }
  }

  return res;
}
