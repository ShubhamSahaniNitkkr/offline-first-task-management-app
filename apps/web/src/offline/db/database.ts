import Dexie, { type EntityTable } from 'dexie';
import type {
  CartItem,
  Order,
  PendingOperation,
  Product,
  User,
  UserPreferences,
  WishlistItem,
} from '@oftmp/shared';
import { DEFAULT_USER_PREFERENCES } from '@oftmp/shared';

export interface SyncMetadata {
  key: string;
  value: string;
}

export class AppDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>;
  cartItems!: EntityTable<CartItem, 'id'>;
  wishlistItems!: EntityTable<WishlistItem, 'id'>;
  orders!: EntityTable<Order, 'id'>;
  pendingOperations!: EntityTable<PendingOperation, 'id'>;
  syncMetadata!: EntityTable<SyncMetadata, 'key'>;
  userPreferences!: EntityTable<UserPreferences & { id: string }, 'id'>;
  users!: EntityTable<User, 'id'>;

  constructor() {
    super('vault-commerce-db');

    this.version(1).stores({
      products: 'id, category, featured, price, name, updatedAt',
      cartItems: 'id, productId, syncStatus, updatedAt',
      wishlistItems: 'id, productId, syncStatus, addedAt',
      orders: 'id, clientId, status, syncStatus, createdAt',
      pendingOperations: 'id, status, entityId, createdAt, nextRetryAt',
      syncMetadata: 'key',
      userPreferences: 'id',
      users: 'id, email',
    });
  }
}

export const db = new AppDatabase();

export async function initPreferences() {
  const existing = await db.userPreferences.get('default');
  if (!existing) {
    await db.userPreferences.put({ id: 'default', ...DEFAULT_USER_PREFERENCES });
  }
}

export async function getSyncMetadata(key: string): Promise<string | null> {
  const row = await db.syncMetadata.get(key);
  return row?.value ?? null;
}

export async function setSyncMetadata(key: string, value: string) {
  await db.syncMetadata.put({ key, value });
}

export async function getAccessToken(): Promise<string | null> {
  return getSyncMetadata('accessToken');
}

export async function setSession(token: string, user: User) {
  await setSyncMetadata('accessToken', token);
  await setSyncMetadata('currentUserId', user.id);
  await db.users.put(user);
}

export async function clearSession() {
  await db.syncMetadata.delete('accessToken');
  await db.syncMetadata.delete('currentUserId');
}

export async function getCurrentUserId(): Promise<string | null> {
  return getSyncMetadata('currentUserId');
}
