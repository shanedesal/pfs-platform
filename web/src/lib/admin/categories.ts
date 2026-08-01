import { authFetch } from "../api";
import type { AdminCategory } from "../category";

export type AdminCategoryInput = {
  name: string;
  sortOrder?: number;
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const res = await authFetch("/api/admin/categories");
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to fetch categories (${res.status})`));
  return res.json();
}

export async function createAdminCategory(input: AdminCategoryInput): Promise<AdminCategory> {
  const res = await authFetch("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to create category (${res.status})`));
  return res.json();
}

export async function updateAdminCategory(
  id: string,
  input: Partial<AdminCategoryInput>
): Promise<AdminCategory> {
  const res = await authFetch(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to update category (${res.status})`));
  return res.json();
}

/** Throws with the backend's message (e.g. "N products are assigned to this category") on 409. */
export async function deleteAdminCategory(id: string): Promise<void> {
  const res = await authFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to delete category (${res.status})`));
}
