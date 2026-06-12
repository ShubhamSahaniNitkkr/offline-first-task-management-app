import type { OrderStatus, ProductCategory, SyncStatus } from '../constants/index.js';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  rating: number;
  stock: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  addedAt: string;
  syncStatus: SyncStatus;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  clientId?: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PendingOperation {
  id: string;
  type: string;
  entityType: 'cart' | 'wishlist' | 'order' | 'product';
  entityId: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number | null;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  createdAt: number;
  lastError?: string;
}

export interface ShopStats {
  totalProducts: number;
  categories: number;
  cartItems: number;
  pendingOrders: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SyncPushOperation {
  type: string;
  entityId: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  clientTimestamp: string;
}

export interface SyncPushResult {
  idempotencyKey: string;
  status: 'success' | 'conflict' | 'failed';
  entity?: Order | CartItem;
  error?: string;
}

export interface UserPreferences {
  theme: 'light';
  notifications: {
    syncStarted: boolean;
    syncCompleted: boolean;
    syncFailed: boolean;
    offlineMode: boolean;
  };
  sync: {
    autoSync: boolean;
    intervalSeconds: number;
    conflictResolution: 'lww' | 'server_wins' | 'ask';
  };
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'light',
  notifications: {
    syncStarted: true,
    syncCompleted: true,
    syncFailed: true,
    offlineMode: true,
  },
  sync: {
    autoSync: true,
    intervalSeconds: 30,
    conflictResolution: 'lww',
  },
};
