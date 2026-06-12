import { useLiveQuery } from 'dexie-react-hooks';
import { Group, Paper, Text } from '@mantine/core';
import { db } from '../../../offline/db/database.js';
import { useAppSelector } from '../../../store/hooks.js';
import { useGetShopStatsQuery } from '../../../store/api/index.js';
import { useNetworkStatus } from '../../sync/hooks/useSyncStatus.js';

export function ShopStatsBar() {
  const { data } = useGetShopStatsQuery();
  const queueCount = useAppSelector((s) => s.sync.queueCount);
  const { isOffline } = useNetworkStatus();

  const local = useLiveQuery(async () => {
    const [products, cart, orders] = await Promise.all([
      db.products.count(),
      db.cartItems.count(),
      db.orders.filter((o) => o.syncStatus === 'pending').count(),
    ]);
    return { products, cart, orders };
  });

  const stats = {
    products: data?.totalProducts ?? local?.products ?? 0,
    cart: local?.cart ?? 0,
    pendingOrders: local?.orders ?? 0,
    queue: queueCount,
  };

  const items = [
    { label: 'Products cached', value: stats.products },
    { label: 'In your cart', value: stats.cart },
    ...(isOffline
      ? [
          { label: 'Pending orders', value: stats.pendingOrders },
          { label: 'Sync queue', value: stats.queue },
        ]
      : []),
  ];

  return (
    <Group grow>
      {items.map((item) => (
        <Paper key={item.label} p="md" radius="lg" className="stat-pill" withBorder>
          <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
            {item.label}
          </Text>
          <Text size="xl" fw={700} className="stat-pill__value">
            {item.value}
          </Text>
        </Paper>
      ))}
    </Group>
  );
}
