export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  /** Cover / thumbnail URL (required). */
  imageUrl: string;
};
