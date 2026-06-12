export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home',
  'Beauty',
  'Sports',
  'Books',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SYNC_STATUSES = ['synced', 'pending', 'conflict', 'failed'] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const OPERATION_TYPES = [
  'ADD_TO_CART',
  'UPDATE_CART_ITEM',
  'REMOVE_FROM_CART',
  'ADD_TO_WISHLIST',
  'REMOVE_FROM_WISHLIST',
  'CREATE_ORDER',
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_RETRIES = 5;
export const BASE_RETRY_DELAY_MS = 1000;
export const MAX_RETRY_DELAY_MS = 60000;

export const BROADCAST_CHANNEL_NAME = 'oftmp-sync-v1';
