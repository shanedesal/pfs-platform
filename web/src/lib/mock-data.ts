export interface MockProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  unitsSold: number;
  badge?: "Trending" | "Best Seller" | "New";
}

// TODO: replace with GET /api/products?sort=rating,sales once seeded
export const featuredProducts: MockProduct[] = [
  { id: "1", name: "Wireless Noise-Cancelling Headphones", category: "Electronics", price: 129.99, rating: 4.8, reviewCount: 342, unitsSold: 1240, badge: "Best Seller" },
  { id: "2", name: "Ceramic Pour-Over Coffee Set", category: "Home", price: 48.0, rating: 4.6, reviewCount: 128, unitsSold: 610, badge: "Trending" },
  { id: "3", name: "Minimalist Canvas Backpack", category: "Fashion", price: 74.5, rating: 4.7, reviewCount: 205, unitsSold: 890, badge: "Trending" },
  { id: "4", name: "Smart Fitness Band", category: "Electronics", price: 59.99, rating: 4.4, reviewCount: 96, unitsSold: 430, badge: "New" },
  { id: "5", name: "Weighted Sleep Blanket", category: "Home", price: 89.0, rating: 4.9, reviewCount: 512, unitsSold: 1580, badge: "Best Seller" },
  { id: "6", name: "Stainless Steel Chef Knife Set", category: "Home", price: 112.0, rating: 4.5, reviewCount: 167, unitsSold: 320 },
  { id: "7", name: "Portable Bluetooth Speaker", category: "Electronics", price: 45.99, rating: 4.3, reviewCount: 88, unitsSold: 275 },
  { id: "8", name: "Merino Wool Crewneck Sweater", category: "Fashion", price: 68.0, rating: 4.6, reviewCount: 143, unitsSold: 502, badge: "Trending" },
];

export const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Home",
  "Beauty",
  "Sports",
  "Toys",
];