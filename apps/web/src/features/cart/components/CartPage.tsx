import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Image,
  NumberInput,
  Stack,
  Text,
  Title,
  Alert,
  Paper,
} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { IconTrash, IconWifiOff, IconShoppingBag } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { db } from '../../../offline/db/database.js';
import {
  useCartMutations,
  consolidateDuplicateCartItems,
} from '../hooks/useCartMutations.js';
import { useNetworkStatus } from '../../sync/hooks/useSyncStatus.js';
import { useAppSelector } from '../../../store/hooks.js';

export function CartPage() {
  const items = useLiveQuery(
    () => db.cartItems.orderBy('updatedAt').reverse().toArray(),
    [],
  );
  const { updateQuantity, removeFromCart, checkout } = useCartMutations();
  const { isOffline, manualOffline } = useNetworkStatus();
  const queueCount = useAppSelector((s) => s.sync.queueCount);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    void consolidateDuplicateCartItems();
  }, []);

  const totalQty = useMemo(
    () => (items ?? []).reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const total = useMemo(
    () => (items ?? []).reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      await checkout();
      notifications.show({
        title: isOffline ? 'Order saved' : 'Order placed!',
        message: isOffline
          ? 'We\'ll sync your order when you\'re back online.'
          : 'Thank you for your purchase.',
        color: 'green',
      });
    } catch (e) {
      notifications.show({
        title: 'Checkout failed',
        message: e instanceof Error ? e.message : 'Please try again',
        color: 'red',
      });
    } finally {
      setCheckingOut(false);
    }
  };

  if (!items?.length) {
    return (
      <Stack align="center" py={60} gap="md">
        <IconShoppingBag size={56} stroke={1.2} color="#94a3b8" />
        <Title order={3} fw={700}>
          Your cart is empty
        </Title>
        <Text c="dimmed">Browse the shop and add something you like.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2} fw={700}>
          Shopping cart
        </Title>
        <Badge size="lg" variant="light" color="brand">
          {totalQty} item{totalQty !== 1 ? 's' : ''}
        </Badge>
      </Group>

      {(isOffline || manualOffline) && (
        <Alert icon={<IconWifiOff size={18} />} color="blue" variant="light" radius="md">
          You&apos;re offline — cart is saved locally
          {queueCount > 0 ? ` (${queueCount} pending sync)` : ''}.
        </Alert>
      )}

      <Stack gap="md">
        {items.map((item) => (
          <Card key={item.id} padding="md" radius="lg" className="cart-line">
            <Group wrap="nowrap" align="flex-start" gap="md">
              <Image
                src={item.productImage}
                w={88}
                h={100}
                radius="md"
                fit="cover"
                alt=""
              />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Text fw={600} size="sm" lineClamp={2}>
                    {item.productName}
                  </Text>
                  {isOffline && item.syncStatus === 'pending' && (
                    <Badge size="xs" color="yellow" variant="light">
                      Pending sync
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed">
                  ${item.price.toFixed(2)} each
                </Text>
                <Group justify="space-between" mt="xs">
                  <NumberInput
                    value={item.quantity}
                    onChange={(v) => void updateQuantity(item.id, Number(v) || 1)}
                    min={1}
                    max={99}
                    w={90}
                    size="xs"
                    radius="md"
                  />
                  <Group gap="md">
                    <Text fw={700} size="sm">
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => void removeFromCart(item.id)}
                      aria-label={`Remove ${item.productName}`}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Stack>
            </Group>
          </Card>
        ))}
      </Stack>

      <Paper className="cart-summary" p="lg" radius="lg" withBorder>
        <Group justify="space-between" mb="lg">
          <Text size="lg" fw={600}>
            Subtotal
          </Text>
          <Text className="cart-summary__total">${total.toFixed(2)}</Text>
        </Group>
        <Button
          fullWidth
          size="md"
          color="brand"
          loading={checkingOut}
          onClick={() => void handleCheckout()}
        >
          {isOffline ? 'Place order (offline)' : 'Checkout'}
        </Button>
        <Text size="xs" c="dimmed" ta="center" mt="sm">
          Free shipping on all orders
        </Text>
      </Paper>
    </Stack>
  );
}
