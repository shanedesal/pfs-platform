export type Category = {
  id: string;
  name: string;
};

/** Shape returned by the admin category endpoints — superset of the public `Category`. */
export type AdminCategory = Category & {
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};
