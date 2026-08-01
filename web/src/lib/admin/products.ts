import { authFetch } from "../api";
import type { AdminProduct, ProductStatus } from "../product";

export type AdminProductListParams = {
  search?: string;
  categoryId?: string;
  status?: ProductStatus | "";
  page?: number;
  pageSize?: number;
};

export type AdminProductListResponse = {
  items: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
  categoryId: string | null;
  imageUrl: string;
  images: string[];
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

function buildListQuery(params: AdminProductListParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));
  return query.toString();
}

export async function fetchAdminProducts(
  params: AdminProductListParams
): Promise<AdminProductListResponse> {
  const res = await authFetch(`/api/admin/products?${buildListQuery(params)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to fetch products (${res.status})`));
  return res.json();
}

export async function fetchAdminProduct(id: string): Promise<AdminProduct> {
  const res = await authFetch(`/api/admin/products/${id}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to fetch product (${res.status})`));
  return res.json();
}

export async function createAdminProduct(input: AdminProductInput): Promise<AdminProduct> {
  const res = await authFetch("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to create product (${res.status})`));
  return res.json();
}

export async function updateAdminProduct(
  id: string,
  input: Partial<AdminProductInput>
): Promise<AdminProduct> {
  const res = await authFetch(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to update product (${res.status})`));
  return res.json();
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const res = await authFetch(`/api/admin/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to delete product (${res.status})`));
}

/** Uploads a single image (cover or gallery) to Supabase Storage via the backend; returns its public URL. */
export async function uploadAdminProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await authFetch("/api/admin/products/upload-image", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to upload image (${res.status})`));
  const data: { url: string } = await res.json();
  return data.url;
}
