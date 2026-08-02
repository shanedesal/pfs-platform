import { authFetch } from "./api";

export type UpdateProfilePayload = {
  phoneNumber: string;
};

export type ProfileUser = {
  id: string;
  email: string;
  name: string;
  phoneNumber: string | null;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

/** PATCH /api/auth/me — update the signed-in user's contact number. */
export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<ProfileUser> {
  const res = await authFetch("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to update profile"));
  }
  return res.json();
}
