import { authFetch } from "../api";
import type { Address } from "../addresses";
import type { OrderStatus, PaymentMethod } from "../orders";

/** Row shape for the admin customer table — includes computed order stats. */
export type AdminCustomerListItem = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  totalPurchase: number;
};

export type AdminCustomerListParams = {
  search?: string;
  status?: "active" | "disabled" | "";
  page?: number;
  pageSize?: number;
};

export type AdminCustomerListResponse = {
  items: AdminCustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
};

/** Lightweight order row shown on the customer detail page (no line items). */
export type AdminCustomerOrder = {
  id: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  total: number;
  createdAt: string;
};

export type AdminCustomerDetail = AdminCustomerListItem & {
  orders: AdminCustomerOrder[];
  addresses: Address[];
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

function buildListQuery(params: AdminCustomerListParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));
  return query.toString();
}

export async function fetchAdminCustomers(
  params: AdminCustomerListParams
): Promise<AdminCustomerListResponse> {
  const res = await authFetch(`/api/admin/customers?${buildListQuery(params)}`);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, `Failed to fetch customers (${res.status})`));
  }
  return res.json();
}

export async function fetchAdminCustomer(id: string): Promise<AdminCustomerDetail> {
  const res = await authFetch(`/api/admin/customers/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, `Failed to fetch customer (${res.status})`));
  }
  return res.json();
}

/** PATCH /api/admin/customers/:id/status — enable/disable a customer account. */
export async function updateAdminCustomerStatus(
  id: string,
  isActive: boolean
): Promise<AdminCustomerListItem> {
  const res = await authFetch(`/api/admin/customers/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, `Failed to update account status (${res.status})`));
  }
  return res.json();
}
