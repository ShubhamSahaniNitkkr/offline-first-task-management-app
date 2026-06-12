import { createApi } from '@reduxjs/toolkit/query/react';
import type { AuthTokens, Order, PaginatedMeta, Product, ShopStats, User } from '@oftmp/shared';
import type { LoginInput, ProductQueryInput } from '@oftmp/shared';
import { offlineAwareBaseQuery, getApiBaseUrl } from './baseApi.js';
import { clearSession, setSession } from '../../offline/db/database.js';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: offlineAwareBaseQuery,
  tagTypes: ['Product', 'Cart', 'Wishlist', 'Orders', 'Shop', 'Auth'],
  endpoints: () => ({}),
});

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthTokens, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (response: { data: AuthTokens }) => response.data,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await setSession(data.accessToken, data.user);
        } catch {
          /* handled in UI */
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          await clearSession();
        }
      },
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<{ data: Product[]; meta: PaginatedMeta }, ProductQueryInput | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '') searchParams.set(key, String(value));
          });
        }
        const qs = searchParams.toString();
        return `/products${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { db } = await import('../../offline/db/database.js');
          for (const product of data.data) {
            await db.products.put(product);
          }
        } catch {
          /* offline fallback */
        }
      },
    }),
    getProduct: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      transformResponse: (response: { data: Product }) => response.data,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
  }),
});

export const shopApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getShopStats: builder.query<ShopStats, void>({
      query: () => '/shop/stats',
      transformResponse: (response: { data: ShopStats }) => response.data,
      providesTags: ['Shop'],
    }),
  }),
});

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => '/orders',
      transformResponse: (response: { data: Order[] }) => response.data,
      providesTags: ['Orders'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;

export const { useGetProductsQuery, useGetProductQuery } = productsApi;
export const { useGetShopStatsQuery } = shopApi;
export const { useGetOrdersQuery } = ordersApi;
export { getApiBaseUrl };
