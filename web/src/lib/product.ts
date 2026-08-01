export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  /** Cover / thumbnail URL (required). */
  imageUrl: string;
};

export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

export const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
];

export type ProductGalleryImage = {
  id: string;
  url: string;
  sortOrder: number;
};

/** Shape returned by the admin product endpoints — superset of the public `Product`. */
export type AdminProduct = Product & {
  status: ProductStatus;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  /** Gallery — only present on the single-product (edit) response, not the list. */
  images?: ProductGalleryImage[];
};
