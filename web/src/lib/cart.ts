import { authFetch } from "./api";
import type { ProductStatus } from "./product";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  status: ProductStatus;
};

export type CartItem = {
  productId: string;
  quantity: number;
  lineTotal: number;
  available: boolean;
  product: CartProduct;
};

export type Cart = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
};

export const EMPTY_CART: Cart = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  total: 0,
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

export async function fetchCart(): Promise<Cart> {
  const res = await authFetch("/api/cart");
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to load cart"));
  }
  return res.json();
}

export async function addToCart(productId: string, quantity = 1): Promise<Cart> {
  const res = await authFetch("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to add to cart"));
  }
  return res.json();
}

export async function updateCartItemQuantity(
  productId: string,
  quantity: number
): Promise<Cart> {
  const res = await authFetch(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to update cart"));
  }
  return res.json();
}

export async function removeFromCart(productId: string): Promise<Cart> {
  const res = await authFetch(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to remove item"));
  }
  return res.json();
}

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
