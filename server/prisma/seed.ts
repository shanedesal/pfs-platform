import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';
import prisma from '../src/config/db';

const mockProducts = [
  { id: "1", name: "Wireless Noise-Cancelling Headphones", category: "Electronics", price: 129.99, rating: 4.8, reviewCount: 342, unitsSold: 1240, badge: "Best Seller" },
  { id: "2", name: "Ceramic Pour-Over Coffee Set", category: "Home", price: 48.0, rating: 4.6, reviewCount: 128, unitsSold: 610, badge: "Trending" },
  { id: "3", name: "Minimalist Canvas Backpack", category: "Fashion", price: 74.5, rating: 4.7, reviewCount: 205, unitsSold: 890, badge: "Trending" },
  { id: "4", name: "Smart Fitness Band", category: "Electronics", price: 59.99, rating: 4.4, reviewCount: 96, unitsSold: 430, badge: "New" },
  { id: "5", name: "Weighted Sleep Blanket", category: "Home", price: 89.0, rating: 4.9, reviewCount: 512, unitsSold: 1580, badge: "Best Seller" },
  { id: "6", name: "Stainless Steel Chef Knife Set", category: "Home", price: 112.0, rating: 4.5, reviewCount: 167, unitsSold: 320 },
  { id: "7", name: "Portable Bluetooth Speaker", category: "Electronics", price: 45.99, rating: 4.3, reviewCount: 88, unitsSold: 275 },
  { id: "8", name: "Merino Wool Crewneck Sweater", category: "Fashion", price: 68.0, rating: 4.6, reviewCount: 143, unitsSold: 502, badge: "Trending" },
];

async function main() {
  console.log(`Start seeding ...`);

  // Seed Admin
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user with id: ${admin.id}`);

  // Seed Customer
  const customerPassword = await bcrypt.hash('password123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Customer User',
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  });
  console.log(`Created customer user with id: ${customer.id}`);

  // Seed Products
  for (const product of mockProducts) {
    const createdProduct = await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        price: product.price,
        description: `${product.category} - ${product.badge ? product.badge : 'Standard'} Item`,
        stock: 100, // Default mock stock
      },
      create: {
        id: product.id,
        name: product.name,
        price: product.price,
        description: `${product.category} - ${product.badge ? product.badge : 'Standard'} Item`,
        stock: 100,
      },
    });
    console.log(`Upserted product: ${createdProduct.name}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
