import { authFetch } from "./api";

export type PaymentMethod = "CASH_ON_DELIVERY" | "E_WALLET" | "BANK_TRANSFER";

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

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
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  orderNotes?: string;
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

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
