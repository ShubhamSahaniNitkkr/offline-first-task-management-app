import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { db, getAccessToken } from '../../offline/db/database.js';
import { isEffectivelyOnline } from '../../offline/networkGate.js';
import { logOfflineStep } from '../../offline/offlineActivityLogger.js';
import { resolveApiBaseUrl } from '../../lib/apiUrl.js';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: resolveApiBaseUrl(),
  prepareHeaders: async (headers) => {
    const token = await getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const offlineAwareBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  if (!isEffectivelyOnline()) {
    const url = typeof args === 'string' ? args : args.url;

    if (url.includes('/products') && (typeof args === 'string' || !args.method || args.method === 'GET')) {
      const products = await db.products.toArray();
      logOfflineStep('Catalog cache', `Serving ${products.length} products from IndexedDB`, 'completed');
      return {
        data: {
          data: products,
          meta: { page: 1, limit: products.length, total: products.length, totalPages: 1 },
        },
      };
    }

    if (url.includes('/shop/stats')) {
      const products = await db.products.toArray();
      const cartItems = await db.cartItems.toArray();
      const orders = await db.orders.filter((o) => o.syncStatus === 'pending').toArray();
      logOfflineStep('Shop stats', 'Computed from local IndexedDB', 'completed');
      return {
        data: {
          data: {
            totalProducts: products.length,
            categories: new Set(products.map((p) => p.category)).size,
            cartItems: cartItems.length,
            pendingOrders: orders.length,
          },
        },
      };
    }

    if (url.includes('/orders')) {
      const orders = await db.orders.toArray();
      logOfflineStep('Orders', `Serving ${orders.length} orders from cache`, 'completed');
      return { data: { data: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) } };
    }

    logOfflineStep('Network', `Blocked offline: ${url}`, 'skipped');
    return { error: { status: 503, data: { error: { message: 'Offline' } } } };
  }

  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.data && typeof args === 'object' && args.url?.includes('/products') && !args.method) {
    const payload = result.data as { data?: unknown[] };
    if (Array.isArray(payload.data)) {
      for (const product of payload.data as Parameters<typeof db.products.put>[0][]) {
        await db.products.put(product);
      }
    }
  }

  return result;
};

export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}
