import { memo, useState, type MouseEvent } from 'react';
import { Badge, Box, Button, Card, Group, Image, Stack, Text } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { IconHeart, IconHeartFilled, IconShoppingBagPlus, IconLoader2 } from '@tabler/icons-react';
import type { Product } from '@oftmp/shared';
import { db } from '../../../offline/db/database.js';
import { useCartMutations } from '../../cart/hooks/useCartMutations.js';
import { useWishlistMutations } from '../../wishlist/hooks/useWishlistMutations.js';
import { useNetworkStatus } from '../../sync/hooks/useSyncStatus.js';
import { notifications } from '@mantine/notifications';
import { cartAddedMessage, favouriteMessage } from '../../../lib/offlineNotify.js';

interface ProductCardProps {
  product: Product;
}

function ProductCardComponent({ product }: ProductCardProps) {
  const { addToCart } = useCartMutations();
  const { toggleWishlist } = useWishlistMutations();
  const { isOffline } = useNetworkStatus();
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const wishlistItem = useLiveQuery(
    () => db.wishlistItems.where('productId').equals(product.id).first(),
    [product.id],
  );
  const isFavourite = !!wishlistItem;

  const handleAdd = async () => {
    setCartLoading(true);
    try {
      await addToCart(product);
      notifications.show({
        title: 'Added to cart',
        message: cartAddedMessage(product.name, isOffline),
        color: 'green',
      });
    } finally {
      setCartLoading(false);
    }
  };

  const handleFavourite = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      const added = await toggleWishlist(product);
      notifications.show({
        title: added ? 'Added to favourites' : 'Removed from favourites',
        message: favouriteMessage(product.name, added, isOffline),
        color: added ? 'pink' : 'gray',
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Card className="product-card" padding={0} radius="lg" withBorder>
      <Box pos="relative" className="product-card__image-wrap">
        <Image src={product.imageUrl} alt={product.name} h={260} fit="cover" />
        {product.featured && (
          <Badge className="product-card__badge" color="brand" variant="light" size="sm">
            Featured
          </Badge>
        )}
        <button
          type="button"
          className={`product-card__favourite${isFavourite ? ' product-card__favourite--active' : ''}`}
          onClick={(e) => void handleFavourite(e)}
          disabled={wishlistLoading}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          aria-pressed={isFavourite}
        >
          {wishlistLoading ? (
            <IconLoader2 size={22} className="spin-icon" aria-hidden />
          ) : isFavourite ? (
            <IconHeartFilled size={22} aria-hidden />
          ) : (
            <IconHeart size={22} stroke={2} aria-hidden />
          )}
        </button>
      </Box>

      <Stack gap={6} p="md">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
          {product.category}
        </Text>
        <Text fw={600} size="sm" lineClamp={2} className="product-card__title">
          {product.name}
        </Text>
        <Group justify="space-between" mt={4}>
          <Text size="md" className="product-card__price">
            ${product.price.toFixed(2)}
          </Text>
          <Text size="xs" c="dimmed" fw={500}>
            ★ {product.rating.toFixed(1)}
          </Text>
        </Group>
        <Button
          fullWidth
          mt="xs"
          color="brand"
          variant="filled"
          size="sm"
          leftSection={<IconShoppingBagPlus size={16} />}
          loading={cartLoading}
          onClick={() => void handleAdd()}
        >
          Add to cart
        </Button>
      </Stack>
    </Card>
  );
}

export const ProductCard = memo(ProductCardComponent);
