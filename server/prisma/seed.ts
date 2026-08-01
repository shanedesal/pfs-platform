import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';
import prisma from '../src/config/db';

const STORAGE_BASE =
  'https://ifssdnnzyfmoiughbfky.supabase.co/storage/v1/object/public/pfs-products';

const mockCategories = [
  { name: "Electronics", sortOrder: 1 },
  { name: "Fashion", sortOrder: 2 },
  { name: "Home", sortOrder: 3 },
  { name: "Beauty", sortOrder: 4 },
  { name: "Sports", sortOrder: 5 },
  { name: "Toys", sortOrder: 6 },
];

const mockProducts = [
  {
    id: "1",
    name: "Wireless Noise-Cancelling Headphones",
    category: "Electronics",
    price: 129.99,
    badge: "Best Seller",
    imageUrl: `${STORAGE_BASE}/noisecancellinghp.jpg`,
  },
  {
    id: "2",
    name: "Ceramic Pour-Over Coffee Set",
    category: "Home",
    price: 48.0,
    badge: "Trending",
    imageUrl: `${STORAGE_BASE}/ceramiccoffeeset.jpg`,
  },
  {
    id: "3",
    name: "Minimalist Canvas Backpack",
    category: "Fashion",
    price: 74.5,
    badge: "Trending",
    imageUrl: `${STORAGE_BASE}/Minimalistbpack.jpg`,
  },
  {
    id: "4",
    name: "Smart Fitness Band",
    category: "Electronics",
    price: 59.99,
    badge: "New",
    imageUrl: `${STORAGE_BASE}/smartfband.jpg`,
  },
  {
    id: "5",
    name: "Weighted Sleep Blanket",
    category: "Home",
    price: 89.0,
    badge: "Best Seller",
    imageUrl: `${STORAGE_BASE}/linenblanket.jpg`,
  },
  {
    id: "6",
    name: "Stainless Steel Chef Knife Set",
    category: "Home",
    price: 112.0,
    imageUrl: `${STORAGE_BASE}/knife.jpg`,
  },
  {
    id: "7",
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    price: 45.99,
    imageUrl: `${STORAGE_BASE}/portablebspeaker.jpg`,
  },
  {
    id: "8",
    name: "Merino Wool Crewneck Sweater",
    category: "Fashion",
    price: 68.0,
    badge: "Trending",
    imageUrl: `${STORAGE_BASE}/merino.jpg`,
  },
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

  // Seed Categories
  const categoryByName = new Map<string, string>();
  for (const category of mockCategories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: { sortOrder: category.sortOrder },
      create: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });
    categoryByName.set(created.name, created.id);
    console.log(`Upserted category: ${created.name}`);
  }

  // Seed Products (cover image required; gallery left empty for now)
  for (const product of mockProducts) {
    const categoryId = categoryByName.get(product.category);
    const createdProduct = await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        price: product.price,
        description: `${product.category} - ${product.badge ? product.badge : 'Standard'} Item`,
        stock: 100,
        categoryId,
        imageUrl: product.imageUrl,
      },
      create: {
        id: product.id,
        name: product.name,
        price: product.price,
        description: `${product.category} - ${product.badge ? product.badge : 'Standard'} Item`,
        stock: 100,
        categoryId,
        imageUrl: product.imageUrl,
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
