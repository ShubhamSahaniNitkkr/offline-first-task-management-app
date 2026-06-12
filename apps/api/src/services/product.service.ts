import { and, asc, count, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductQueryInput, ShopStats } from '@oftmp/shared';
import { PRODUCT_CATEGORIES } from '@oftmp/shared';
import type { Env } from '../config/env.js';
import { getDb } from '../db/index.js';
import { products } from '../db/schema.js';
import { AppError } from '../lib/errors.js';

const CATALOG: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: 'Aurora Wireless Headphones', description: 'Premium noise-cancelling with 40h battery.', price: 249.99, category: 'Electronics', imageUrl: '', rating: 4.8, stock: 32, featured: true },
  { name: 'Lumen Smart Watch', description: 'Titanium case, health tracking, sapphire glass.', price: 399.0, category: 'Electronics', imageUrl: '', rating: 4.7, stock: 18, featured: true },
  { name: 'Velvet Merino Crew', description: 'Ultra-soft merino wool, relaxed fit.', price: 89.5, category: 'Fashion', imageUrl: '', rating: 4.6, stock: 45, featured: true },
  { name: 'Saffron Leather Tote', description: 'Hand-finished Italian leather.', price: 320.0, category: 'Fashion', imageUrl: '', rating: 4.9, stock: 12, featured: false },
  { name: 'Ceramic Pour-Over Set', description: 'Minimalist brew kit for slow mornings.', price: 64.0, category: 'Home', imageUrl: '', rating: 4.5, stock: 28, featured: true },
  { name: 'Linen Duvet Cover', description: 'Stone-washed European flax linen.', price: 178.0, category: 'Home', imageUrl: '', rating: 4.7, stock: 22, featured: false },
  { name: 'Botanical Face Serum', description: 'Vitamin C + hyaluronic acid glow complex.', price: 48.0, category: 'Beauty', imageUrl: '', rating: 4.4, stock: 60, featured: false },
  { name: 'Rose Quartz Roller', description: 'Cooling facial massage tool.', price: 32.0, category: 'Beauty', imageUrl: '', rating: 4.3, stock: 40, featured: false },
  { name: 'Carbon Trail Runners', description: 'Lightweight grip for urban trails.', price: 145.0, category: 'Sports', imageUrl: '', rating: 4.6, stock: 35, featured: true },
  { name: 'Yoga Mat Pro', description: '5mm natural rubber, anti-slip.', price: 78.0, category: 'Sports', imageUrl: '', rating: 4.5, stock: 50, featured: false },
  { name: 'Midnight Fiction Anthology', description: 'Curated stories from new voices.', price: 24.99, category: 'Books', imageUrl: '', rating: 4.2, stock: 80, featured: false },
  { name: 'Design Systems Handbook', description: 'Build cohesive product UI at scale.', price: 42.0, category: 'Books', imageUrl: '', rating: 4.8, stock: 25, featured: false },
  { name: 'Studio Desk Lamp', description: 'Warm dimmable LED, matte brass.', price: 119.0, category: 'Home', imageUrl: '', rating: 4.6, stock: 15, featured: false },
  { name: 'Silk Evening Scarf', description: 'Hand-rolled edges, limited edition.', price: 156.0, category: 'Fashion', imageUrl: '', rating: 4.7, stock: 8, featured: true },
  { name: 'Portable SSD 1TB', description: 'USB-C, 1050MB/s read speeds.', price: 129.99, category: 'Electronics', imageUrl: '', rating: 4.5, stock: 42, featured: false },
  { name: 'Espresso Machine Mini', description: 'Compact barista-grade pressure system.', price: 289.0, category: 'Home', imageUrl: '', rating: 4.4, stock: 10, featured: false },
  { name: 'SPF 50 Sun Milk', description: 'Invisible finish, reef-safe formula.', price: 28.0, category: 'Beauty', imageUrl: '', rating: 4.6, stock: 55, featured: false },
  { name: 'Resistance Band Set', description: 'Five levels, includes carry pouch.', price: 36.0, category: 'Sports', imageUrl: '', rating: 4.3, stock: 70, featured: false },
  { name: 'Mechanical Keyboard', description: 'Hot-swap switches, aluminum frame.', price: 199.0, category: 'Electronics', imageUrl: '', rating: 4.8, stock: 20, featured: true },
  { name: 'Cashmere Beanie', description: 'Mongolian cashmere, rib knit.', price: 68.0, category: 'Fashion', imageUrl: '', rating: 4.5, stock: 30, featured: false },
  { name: 'Ceramic Vase Set', description: 'Three organic shapes, matte glaze.', price: 54.0, category: 'Home', imageUrl: '', rating: 4.4, stock: 24, featured: false },
  { name: 'Night Repair Cream', description: 'Peptide complex, dermatologist tested.', price: 72.0, category: 'Beauty', imageUrl: '', rating: 4.7, stock: 38, featured: true },
  { name: 'Hiking Backpack 28L', description: 'Weather-resistant, ergonomic support.', price: 112.0, category: 'Sports', imageUrl: '', rating: 4.6, stock: 16, featured: false },
  { name: 'Product Thinking', description: 'Essays on building what matters.', price: 29.0, category: 'Books', imageUrl: '', rating: 4.5, stock: 44, featured: false },
];

function mapProduct(row: typeof products.$inferSelect): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category as Product['category'],
    imageUrl: row.imageUrl,
    rating: row.rating,
    stock: row.stock,
    featured: Boolean(row.featured),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function seedProducts(env: Env) {
  const db = getDb(env.DATABASE_URL);
  const existing = await db.select().from(products).limit(1);
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  for (const item of CATALOG) {
    const id = uuidv4();
    await db.insert(products).values({
      id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: `https://picsum.photos/seed/${id}/600/750`,
      rating: item.rating,
      stock: item.stock,
      featured: item.featured ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${CATALOG.length} products`);
}

export async function listProducts(env: Env, query: ProductQueryInput) {
  const db = getDb(env.DATABASE_URL);
  const conditions = [];

  if (query.category) conditions.push(eq(products.category, query.category));
  if (query.featured) conditions.push(eq(products.featured, 1));
  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(or(like(products.name, term), like(products.description, term))!);
  }
  if (query.minPrice !== undefined) conditions.push(gte(products.price, query.minPrice));
  if (query.maxPrice !== undefined) conditions.push(lte(products.price, query.maxPrice));

  const where = conditions.length ? and(...conditions) : undefined;
  const sortCol = {
    price: products.price,
    name: products.name,
    rating: products.rating,
    createdAt: products.createdAt,
  }[query.sort];
  const orderFn = query.order === 'asc' ? asc : desc;
  const offset = (query.page - 1) * query.limit;

  const [totalResult] = await db.select({ value: count() }).from(products).where(where);
  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(query.limit)
    .offset(offset);

  return {
    data: rows.map(mapProduct),
    meta: {
      page: query.page,
      limit: query.limit,
      total: totalResult?.value ?? 0,
      totalPages: Math.ceil((totalResult?.value ?? 0) / query.limit),
    },
  };
}

export async function getProductById(env: Env, id: string): Promise<Product> {
  const db = getDb(env.DATABASE_URL);
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  return mapProduct(row);
}

export async function getShopStats(env: Env): Promise<ShopStats> {
  const db = getDb(env.DATABASE_URL);
  const [total] = await db.select({ value: count() }).from(products);
  return {
    totalProducts: total?.value ?? 0,
    categories: PRODUCT_CATEGORIES.length,
    cartItems: 0,
    pendingOrders: 0,
  };
}

export async function getProductsSince(env: Env, since: string): Promise<Product[]> {
  const db = getDb(env.DATABASE_URL);
  const rows = await db
    .select()
    .from(products)
    .where(gte(products.updatedAt, since));
  return rows.map(mapProduct);
}

export { mapProduct };
