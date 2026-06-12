import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { IconPackage } from '@tabler/icons-react';
import { db } from '../../../offline/db/database.js';
import { useGetOrdersQuery } from '../../../store/api/index.js';

const statusColors: Record<string, string> = {
  pending: 'yellow',
  confirmed: 'blue',
  shipped: 'cyan',
  delivered: 'green',
  cancelled: 'red',
};

export function OrdersPage() {
  const { data: serverOrders } = useGetOrdersQuery();
  const localOrders = useLiveQuery(() =>
    db.orders.orderBy('createdAt').reverse().toArray(),
  );

  const orders = localOrders?.length ? localOrders : serverOrders ?? [];

  if (!orders.length) {
    return (
      <Stack align="center" py="xl" gap="md">
        <IconPackage size={48} stroke={1.2} opacity={0.4} />
        <Title order={3}>No orders yet</Title>
        <Text c="dimmed">Orders placed offline appear here once queued.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Orders</Title>
      <Text c="dimmed" size="sm">
        View order history from cache — including orders placed while offline.
      </Text>
      <Stack gap="md">
        {orders.map((order) => (
          <Card key={order.id} padding="lg" radius="lg">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Order #{order.id.slice(0, 8)}</Text>
              <Group gap="xs">
                <Badge color={statusColors[order.status] ?? 'gray'}>{order.status}</Badge>
                {order.syncStatus === 'pending' && (
                  <Badge color="orange" variant="light">
                    Awaiting sync
                  </Badge>
                )}
              </Group>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              {new Date(order.createdAt).toLocaleString()} · {order.items.length} item(s)
            </Text>
            <Group justify="space-between">
              <Stack gap={2}>
                {order.items.map((item, i) => (
                  <Text key={i} size="sm">
                    {item.quantity}× {item.productName}
                  </Text>
                ))}
              </Stack>
              <Text fw={700} size="lg">
                ${order.total.toFixed(2)}
              </Text>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
