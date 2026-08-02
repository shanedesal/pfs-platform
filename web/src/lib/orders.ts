import { authFetch } from "./api";

export type PaymentMethod = "CASH_ON_DELIVERY" | "E_WALLET" | "BANK_TRANSFER";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Customers may only self-cancel while the order hasn't been confirmed by an admin yet. */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === "PENDING";
}

export type OrderItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  contactNumber: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  orderNotes: string | null;
  status: OrderStatus;
  subtotal: number;
  total: number;
  items: OrderItem[];
  itemCount: number;
  createdAt: string;
};

export type PlaceOrderPayload = {
  addressId: string;
  paymentMethod: PaymentMethod;
  orderNotes?: string;
};

/** Row shape for the customer's order history list — lighter than the full `Order` detail. */
export type OrderListItem = {
  id: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  total: number;
  createdAt: string;
};

export type OrderListParams = {
  status?: OrderStatus | "";
  page?: number;
  pageSize?: number;
};

export type OrderListResponse = {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_OPTIONS.find((o) => o.value === method)?.label ?? method;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  const res = await authFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to place order"));
  }
  return res.json();
}

export async function fetchOrder(orderNumber: string): Promise<Order> {
  const res = await authFetch(
    `/api/orders/${encodeURIComponent(orderNumber)}`
  );
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to load order"));
  }
  return res.json();
}

/** GET /api/orders — the signed-in customer's own order history. */
export async function listMyOrders(params: OrderListParams = {}): Promise<OrderListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const res = await authFetch(`/api/orders?${query.toString()}`);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to load orders"));
  }
  return res.json();
}

/** PATCH /api/orders/:orderNumber/cancel — self-service cancellation while still `PENDING`. */
export async function cancelOrder(orderNumber: string): Promise<Order> {
  const res = await authFetch(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to cancel order"));
  }
  return res.json();
}

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
