import { v4 as uuidv4 } from 'uuid';
import type { CartItem, Product } from '@oftmp/shared';
import { db, getAccessToken } from '../../../offline/db/database.js';
import {
  enqueueOperation,
  getQueueCount,
  purgeCartOperations,
  purgeWishlistOperations,
} from '../../../offline/queue/operationQueue.js';
import { broadcastQueueChanged } from '../../../offline/crossTab/broadcastSync.js';
import { isEffectivelyOnline } from '../../../offline/networkGate.js';
import { logOfflineStep } from '../../../offline/offlineActivityLogger.js';
import { useAppDispatch } from '../../../store/hooks.js';
import { setQueueCount } from '../../../store/slices/syncSlice.js';
import { api } from '../../../store/api/index.js';
import { getApiBaseUrl } from '../../../store/api/index.js';

async function refreshQueue(dispatch: ReturnType<typeof useAppDispatch>) {
  const count = await getQueueCount();
  dispatch(setQueueCount(count));
  broadcastQueueChanged(count);
  return count;
}

/** Merge duplicate lines for the same product into one cart row. */
export async function consolidateDuplicateCartItems() {
  const items = await db.cartItems.toArray();
  const byProduct = new Map<string, CartItem>();

  for (const item of items) {
    const existing = byProduct.get(item.productId);
    if (existing) {
      const merged: CartItem = {
        ...existing,
        quantity: existing.quantity + item.quantity,
        updatedAt: new Date().toISOString(),
      };
      byProduct.set(item.productId, merged);
      if (item.id !== existing.id) {
        await db.cartItems.delete(item.id);
      }
    } else {
      byProduct.set(item.productId, item);
    }
  }

  for (const item of byProduct.values()) {
    await db.cartItems.put(item);
  }
}

export function useCartMutations() {
  const dispatch = useAppDispatch();

  const addToCart = async (product: Product, quantity = 1) => {
    await consolidateDuplicateCartItems();

    const offline = !isEffectivelyOnline();
    if (offline) {
      logOfflineStep('Cart', `Adding "${product.name}" ×${quantity}`, 'running');
    }

    const existing = await db.cartItems.where('productId').equals(product.id).first();
    const now = new Date().toISOString();
    const syncStatus = offline ? ('pending' as const) : ('synced' as const);

    if (existing) {
      const updated: CartItem = {
        ...existing,
        quantity: existing.quantity + quantity,
        syncStatus,
        updatedAt: now,
      };
      await db.cartItems.put(updated);
      if (offline) {
        await enqueueOperation('UPDATE_CART_ITEM', 'cart', existing.id, {
          productId: product.id,
          quantity: updated.quantity,
        });
        logOfflineStep('IndexedDB', `Quantity updated → ${updated.quantity}`, 'completed');
      }
    } else {
      const id = uuidv4();
      const item: CartItem = {
        id,
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        price: product.price,
        quantity,
        syncStatus,
        updatedAt: now,
      };
      await db.cartItems.put(item);
      if (offline) {
        await enqueueOperation('ADD_TO_CART', 'cart', id, {
          productId: product.id,
          quantity,
          price: product.price,
        });
        logOfflineStep('IndexedDB', 'New cart line saved locally', 'completed');
      }
    }

    if (offline) {
      const count = await refreshQueue(dispatch);
      logOfflineStep('Operation queue', `${count} change(s) waiting to sync`, 'waiting');
    }

    dispatch(api.util.invalidateTags(['Shop']));
    return db.cartItems.where('productId').equals(product.id).first();
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    const item = await db.cartItems.get(cartItemId);
    if (!item) return;

    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }

    const offline = !isEffectivelyOnline();
    const updated = {
      ...item,
      quantity,
      syncStatus: offline ? ('pending' as const) : ('synced' as const),
      updatedAt: new Date().toISOString(),
    };
    await db.cartItems.put(updated);

    if (offline) {
      logOfflineStep('Cart', `Update quantity → ${quantity}`, 'running');
      await enqueueOperation('UPDATE_CART_ITEM', 'cart', cartItemId, {
        productId: item.productId,
        quantity,
      });
      await refreshQueue(dispatch);
      logOfflineStep('IndexedDB', 'Cart item quantity updated', 'completed');
    }

    dispatch(api.util.invalidateTags(['Shop']));
  };

  const removeFromCart = async (cartItemId: string) => {
    const item = await db.cartItems.get(cartItemId);
    if (!item) return;

    const offline = !isEffectivelyOnline();
    await db.cartItems.delete(cartItemId);

    if (offline) {
      logOfflineStep('Cart', `Removed "${item.productName}"`, 'running');
      await enqueueOperation('REMOVE_FROM_CART', 'cart', cartItemId, { productId: item.productId });
      await refreshQueue(dispatch);
      logOfflineStep('IndexedDB', 'Cart item deleted locally', 'completed');
    }

    dispatch(api.util.invalidateTags(['Shop']));
  };

  const checkout = async () => {
    await consolidateDuplicateCartItems();
    const items = await db.cartItems.toArray();
    if (items.length === 0) throw new Error('Cart is empty');

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const clientId = uuidv4();
    const now = new Date().toISOString();
    const userId = (await db.syncMetadata.get('currentUserId'))?.value ?? 'local-user';
    const offline = !isEffectivelyOnline();

    const orderItems = items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      price: i.price,
      quantity: i.quantity,
    }));

    if (offline) {
      logOfflineStep('Checkout', `Placing order — $${total.toFixed(2)}`, 'running');
    }

    const order = {
      id: clientId,
      clientId,
      userId,
      items: orderItems,
      total,
      status: 'pending' as const,
      syncStatus: offline ? ('pending' as const) : ('synced' as const),
      createdAt: now,
      updatedAt: now,
    };

    await db.orders.put(order);

    if (offline) {
      logOfflineStep('IndexedDB', 'Order saved locally with pending sync', 'completed');
      await enqueueOperation('CREATE_ORDER', 'order', clientId, {
        items: orderItems,
        total,
        clientId,
      });
      await refreshQueue(dispatch);
      logOfflineStep('Operation queue', 'Order queued — sync when online', 'waiting');
    } else {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${getApiBaseUrl()}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems, total, clientId }),
      });

      if (!response.ok) {
        throw new Error('Could not place order on server');
      }

      const { data: serverOrder } = (await response.json()) as { data: typeof order };
      await db.orders.put({ ...serverOrder, syncStatus: 'synced' });
    }

    await db.cartItems.clear();
    dispatch(api.util.invalidateTags(['Orders', 'Shop']));

    if (offline) {
      logOfflineStep('Cart', 'Cart cleared after offline checkout', 'completed');
    }

    return order;
  };

  return { addToCart, updateQuantity, removeFromCart, checkout };
}

/** Call when app is online to clear cart ops that should not block sync UI. */
export async function reconcileOnlineCartQueue(
  dispatch: ReturnType<typeof useAppDispatch>,
) {
  if (!isEffectivelyOnline()) return;
  await purgeCartOperations();
  await purgeWishlistOperations();
  const count = await getQueueCount();
  dispatch(setQueueCount(count));
}
