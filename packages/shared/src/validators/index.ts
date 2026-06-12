import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '../constants/index.js';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  search: z.string().optional(),
  sort: z.enum(['price', 'name', 'rating', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  featured: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        productName: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  total: z.number().positive(),
  clientId: z.string().uuid().optional(),
  idempotencyKey: z.string().uuid().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
