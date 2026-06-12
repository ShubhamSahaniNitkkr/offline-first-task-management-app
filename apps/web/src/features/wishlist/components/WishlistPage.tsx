import {
  Badge,
  Button,
  Card,
  Group,
  Image,
  Stack,
  Text,
  Title,
  Alert,
  Box,
} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { IconHeartOff, IconArrowRight, IconWifiOff } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { db } from '../../../offline/db/database.js';
import { useWishlistMutations } from '../hooks/useWishlistMutations.js';
import { useCartMutations } from '../../cart/hooks/useCartMutations.js';
import { useNetworkStatus } from '../../sync/hooks/useSyncStatus.js';
import { useAppSelector } from '../../../store/hooks.js';
import { movedToCartMessage } from '../../../lib/offlineNotify.js';

export function WishlistPage() {
  const items = useLiveQuery(
    () => db.wishlistItems.orderBy('addedAt').reverse().toArray(),
    [],
  );
  const { removeFromWishlist } = useWishlistMutations();
  const { addToCart } = useCartMutations();
  const { isOffline, manualOffline } = useNetworkStatus();
  const queueCount = useAppSelector((s) => s.sync.queueCount);

  const handleMoveToCart = async (item: NonNullable<typeof items>[number]) => {
    const product = await db.products.get(item.productId);
    if (!product) return;

    await addToCart(product);
    await removeFromWishlist(item.id);

    notifications.show({
      title: 'Moved to cart',
      message: movedToCartMessage(item.productName, isOffline),
      color: 'green',
    });
  };

  if (!items?.length) {
    return (
      <Stack align="center" py={{ base: 40, sm: 60 }} gap="md" px="md">
        <IconHeartOff size={48} stroke={1.2} color="#94a3b8" />
        <Title order={3} ta="center">
          No favourites yet
        </Title>
        <Text c="dimmed" ta="center" maw={360}>
          Tap the heart on any product to save it — works offline and syncs when you are back
          online.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Box>
        <Group gap="sm">
          <Title order={2} fw={700}>
            Favourites
          </Title>
          <Badge size="lg" variant="light" color="pink">
            {items.length}
          </Badge>
        </Group>
        <Text c="dimmed" size="sm" mt={4}>
          {items.length} saved item{items.length !== 1 ? 's' : ''}
        </Text>
      </Box>

      {(isOffline || manualOffline) && (
        <Alert icon={<IconWifiOff size={18} />} color="blue" variant="light" radius="md">
          Favourites are saved locally
          {queueCount > 0 ? ` (${queueCount} pending sync)` : ''}.
        </Alert>
      )}

      <Stack gap="md">
        {items.map((item) => (
          <Card key={item.id} padding="md" radius="lg" className="wishlist-item" withBorder>
            <Stack gap="md">
              <Group align="flex-start" wrap="nowrap" gap="md">
                <Image
                  src={item.productImage}
                  w={88}
                  h={100}
                  miw={88}
                  radius="md"
                  fit="cover"
                  alt=""
                  className="wishlist-item__image"
                />
                <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                  <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                    <Text fw={600} size="sm" lineClamp={2}>
                      {item.productName}
                    </Text>
                    {isOffline && item.syncStatus === 'pending' && (
                      <Badge size="xs" color="yellow" variant="light" style={{ flexShrink: 0 }}>
                        Pending
                      </Badge>
                    )}
                  </Group>
                  <Text fw={700} size="md">
                    ${item.price.toFixed(2)}
                  </Text>
                </Stack>
              </Group>
              <Group grow className="wishlist-item__actions">
                <Button
                  size="sm"
                  variant="light"
                  color="brand"
                  leftSection={<IconArrowRight size={16} />}
                  onClick={() => void handleMoveToCart(item)}
                >
                  Move to cart
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  color="red"
                  onClick={() => void removeFromWishlist(item.id)}
                >
                  Remove
                </Button>
              </Group>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
