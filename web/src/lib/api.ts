export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** In-flight refresh shared across parallel authFetch callers (single-flight). */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
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
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
  });

  if (res.status === 401 && path !== "/api/auth/refresh") {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...options,
      });
    }
  }

  return res;
}
