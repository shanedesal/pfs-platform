"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import {
  addToCart as addToCartApi,
  EMPTY_CART,
  fetchCart,
  removeFromCart as removeFromCartApi,
  updateCartItemQuantity,
  type Cart,
} from "./cart";

interface CartContextType {
  cart: Cart;
  loading: boolean;
  actionError: string | null;
  clearActionError: () => void;
  refetch: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType>({
  cart: EMPTY_CART,
  loading: false,
  actionError: null,
  clearActionError: () => {},
  refetch: async () => {},
  addItem: async () => false,
  updateQuantity: async () => false,
  removeItem: async () => false,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCustomer = user?.role === "CUSTOMER";

  const refetch = useCallback(async () => {
    if (!isCustomer) {
      setCart(EMPTY_CART);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchCart();
      setCart(data);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    if (authLoading) return;
    if (!isCustomer) {
      setCart(EMPTY_CART);
      setLoading(false);
      return;
    }
    refetch();
  }, [authLoading, isCustomer, refetch]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      setActionError(null);
      try {
        const data = await addToCartApi(productId, quantity);
        setCart(data);
        return true;
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Failed to add to cart");
        return false;
      }
    },
    []
  );

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    setActionError(null);
    try {
      const data = await updateCartItemQuantity(productId, quantity);
      setCart(data);
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update cart");
      return false;
    }
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    setActionError(null);
    try {
      const data = await removeFromCartApi(productId);
      setCart(data);
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove item");
      return false;
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        actionError,
        clearActionError: () => setActionError(null),
        refetch,
        addItem,
        updateQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

/** True when the signed-in user can use the shopping cart. */
export function useCanUseCart(): boolean {
  const { user, loading } = useAuth();
  return !loading && user?.role === "CUSTOMER";
}
