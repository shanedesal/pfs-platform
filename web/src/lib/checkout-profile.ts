/** Profile fields required before a customer can complete checkout. */

export type CheckoutProfileUser = {
  phoneNumber: string | null;
};

export function hasCheckoutContactNumber(
  user: CheckoutProfileUser | null | undefined
): boolean {
  return Boolean(user?.phoneNumber?.trim());
}

export function canPlaceOrder(
  user: CheckoutProfileUser | null | undefined
): boolean {
  return hasCheckoutContactNumber(user);
}
