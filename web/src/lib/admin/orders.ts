import { authFetch } from "../api";
import type { Order, OrderStatus, PaymentMethod } from "../orders";

/** Row shape for the admin order table — lighter than the full `Order` detail (no line items). */
export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  total: number;
  createdAt: string;
};

export type AdminOrderListParams = {
  search?: string;
  status?: OrderStatus | "";
  page?: number;
  pageSize?: number;
};

export type AdminOrderListResponse = {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

function buildListQuery(params: AdminOrderListParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));
  return query.toString();
}

export async function fetchAdminOrders(
  params: AdminOrderListParams
): Promise<AdminOrderListResponse> {
  const res = await authFetch(`/api/admin/orders?${buildListQuery(params)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to fetch orders (${res.status})`));
  return res.json();
}

export async function fetchAdminOrder(orderNumber: string): Promise<Order> {
  const res = await authFetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `Failed to fetch order (${res.status})`));
  return res.json();
}

export async function updateAdminOrderStatus(
  orderNumber: string,
  status: OrderStatus
): Promise<Order> {
  const res = await authFetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, `Failed to update order status (${res.status})`));
  }
  return res.json();
}
