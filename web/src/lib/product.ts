export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

export const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
];

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  /** Cover / thumbnail URL (required). */
  imageUrl: string;
  /** Present on storefront catalog/detail responses; omitted on older homepage payloads. */
  status?: ProductStatus;
  category?: { id: string; name: string } | null;
  /** Additional gallery images; only present on the single-product (detail) response. */
  images?: ProductGalleryImage[];
};

/**
 * Longest description an admin can save for a product, in characters.
 * Roughly 5-8 short paragraphs — generous for real copy, but bounded so a
 * pasted wall of text can't blow up storage or the storefront layout.
 */
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 4000;

/** How much of a long description to show before the "See more" toggle kicks in (~1 paragraph). */
export const PRODUCT_DESCRIPTION_PREVIEW_LENGTH = 480;

export type ProductCatalogSort = "newest" | "price-asc" | "price-desc";

export type ProductCatalogResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  sort: ProductCatalogSort;
  q?: string;
  categoryId?: string;
};

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

export function isProductAvailable(product: Product): boolean {
  if (product.status === "OUT_OF_STOCK") return false;
  return product.stock > 0;
}

/**
 * Splits a description into a short preview (~1 paragraph) and whether the
 * full text has more to show. Cuts at the first paragraph break, falling
 * back to a word boundary, and — for text with no spaces at all — a hard
 * character cut so a single unbroken "word" can never render in full.
 */
export function getDescriptionPreview(
  description: string,
  maxLength: number = PRODUCT_DESCRIPTION_PREVIEW_LENGTH
): { preview: string; hasMore: boolean } {
  const firstParagraph = description.split(/\n\s*\n/)[0] ?? description;
  const hasMoreParagraphs = firstParagraph.length < description.length;

  if (firstParagraph.length <= maxLength) {
    return { preview: firstParagraph, hasMore: hasMoreParagraphs };
  }

  const cut = firstParagraph.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const preview = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut;
  return { preview: preview.trimEnd(), hasMore: true };
}
