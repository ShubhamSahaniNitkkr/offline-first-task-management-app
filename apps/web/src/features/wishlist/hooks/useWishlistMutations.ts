import { v4 as uuidv4 } from 'uuid';
import type { Product, WishlistItem } from '@oftmp/shared';
import { db } from '../../../offline/db/database.js';
import { enqueueOperation, getQueueCount } from '../../../offline/queue/operationQueue.js';
import { broadcastQueueChanged } from '../../../offline/crossTab/broadcastSync.js';
import { isEffectivelyOnline } from '../../../offline/networkGate.js';
import { logOfflineStep } from '../../../offline/offlineActivityLogger.js';
import { useAppDispatch } from '../../../store/hooks.js';
import { setQueueCount } from '../../../store/slices/syncSlice.js';

async function refreshQueue(dispatch: ReturnType<typeof useAppDispatch>) {
  const count = await getQueueCount();
  dispatch(setQueueCount(count));
  broadcastQueueChanged(count);
  return count;
}

export function useWishlistMutations() {
  const dispatch = useAppDispatch();

  const addToWishlist = async (product: Product) => {
    const exists = await db.wishlistItems.where('productId').equals(product.id).first();
    if (exists) return exists;

    const offline = !isEffectivelyOnline();
    if (offline) {
      logOfflineStep('Wishlist', `Saved "${product.name}" to favourites`, 'running');
    }

    const item: WishlistItem = {
      id: uuidv4(),
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      price: product.price,
      addedAt: new Date().toISOString(),
      syncStatus: offline ? 'pending' : 'synced',
    };

    await db.wishlistItems.put(item);

    if (offline) {
      await enqueueOperation('ADD_TO_WISHLIST', 'wishlist', item.id, { productId: product.id });
      const count = await refreshQueue(dispatch);
      logOfflineStep('IndexedDB', 'Favourite saved locally', 'completed');
      logOfflineStep('Operation queue', `${count} change(s) waiting to sync`, 'waiting');
    }

    return item;
  };

  const removeFromWishlist = async (id: string) => {
    const item = await db.wishlistItems.get(id);
    if (!item) return;

    const offline = !isEffectivelyOnline();
    await db.wishlistItems.delete(id);

    if (offline) {
      logOfflineStep('Wishlist', `Removed "${item.productName}" from favourites`, 'running');
      await enqueueOperation('REMOVE_FROM_WISHLIST', 'wishlist', id, { productId: item.productId });
      await refreshQueue(dispatch);
      logOfflineStep('IndexedDB', 'Favourite removed locally', 'completed');
    }
  };

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    const existing = await db.wishlistItems.where('productId').equals(product.id).first();
    if (existing) {
      await removeFromWishlist(existing.id);
      return false;
    }
    await addToWishlist(product);
    return true;
  };

  const isInWishlist = async (productId: string) => {
    const item = await db.wishlistItems.where('productId').equals(productId).first();
    return !!item;
  };

  return { addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist };
}
