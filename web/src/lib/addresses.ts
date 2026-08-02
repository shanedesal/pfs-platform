import { authFetch } from "./api";

export type Address = {
  id: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
};

export type AddressInput = {
  label?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode?: string;
  isDefault?: boolean;
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

export async function listAddresses(): Promise<Address[]> {
  const res = await authFetch("/api/addresses");
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to load addresses"));
  }
  return res.json();
}

export async function createAddress(payload: AddressInput): Promise<Address> {
  const res = await authFetch("/api/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to save address"));
  }
  return res.json();
}

export async function updateAddress(
  id: string,
  payload: AddressInput
): Promise<Address> {
  const res = await authFetch(`/api/addresses/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to update address"));
  }
  return res.json();
}

export async function setDefaultAddress(id: string): Promise<Address> {
  const res = await authFetch(`/api/addresses/${encodeURIComponent(id)}/default`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to set default address"));
  }
  return res.json();
}

export async function deleteAddress(id: string): Promise<void> {
  const res = await authFetch(`/api/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseErrorMessage(res, "Failed to delete address"));
  }
}
