import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Code,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Select,
  Skeleton,
} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { IconSearch, IconWifi } from '@tabler/icons-react';
import { PRODUCT_CATEGORIES } from '@oftmp/shared';
import { useGetProductsQuery } from '../../../store/api/index.js';
import { db } from '../../../offline/db/database.js';
import { ProductCard } from './ProductCard.js';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js';
import { ShopStatsBar } from './ShopStatsBar.js';
import { getApiBaseUrl } from '../../../store/api/index.js';

export function ShopHome() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, isLoading, isFetching, isError, error } = useGetProductsQuery({
    search: debouncedSearch || undefined,
    category: (category as never) || undefined,
    limit: 50,
  });

  const localProducts = useLiveQuery(() => db.products.toArray());
  const products = useMemo(() => data?.data ?? localProducts ?? [], [data, localProducts]);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <Stack gap="xl">
      <Box className="shop-hero" p={{ base: 'lg', md: 'xl' }}>
        <Badge color="brand" variant="light" mb="md" leftSection={<IconWifi size={12} />}>
          Works offline
        </Badge>
        <Title className="shop-hero__title" order={1} mb="sm">
          Discover something new
        </Title>
        <Text className="shop-hero__subtitle" maw={520}>
          Shop our curated collection. Add to cart anytime — your bag syncs when you&apos;re back
          online.
        </Text>
      </Box>

      <ShopStatsBar />

      {isError && (
        <Alert color="red" variant="light" title="Could not load products from the API">
          <Stack gap="xs">
            <Text size="sm">
              The shop UI could not reach the backend. This is usually{' '}
              <strong>CORS</strong> or a wrong <strong>API URL</strong> on Render.
            </Text>
            <Text size="sm">
              API URL in use: <Code>{getApiBaseUrl()}</Code>
            </Text>
            <Text size="sm" c="dimmed">
              On the API service, set <Code>CORS_ORIGIN</Code> to your static site URL (no trailing
              slash). On the static site, set <Code>PUBLIC_API_URL</Code> and redeploy.
            </Text>
            {error && 'status' in error && (
              <Text size="xs" c="dimmed">
                HTTP status: {String(error.status)}
              </Text>
            )}
          </Stack>
        </Alert>
      )}

      {featured.length > 0 && !debouncedSearch && !category && (
        <Stack gap="md">
          <Title order={3} fw={700}>
            Staff picks
          </Title>
          <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="lg">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </SimpleGrid>
        </Stack>
      )}

      <Stack gap="md">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Title order={3} fw={700}>
            All products
          </Title>
          <Group wrap="wrap">
            <TextInput
              placeholder="Search products…"
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              w={{ base: '100%', sm: 220 }}
              radius="md"
            />
            <Select
              placeholder="Category"
              clearable
              data={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))}
              value={category}
              onChange={setCategory}
              w={{ base: '100%', sm: 160 }}
              radius="md"
            />
          </Group>
        </Group>

        {isLoading && !localProducts?.length ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={360} radius="lg" />
            ))}
          </SimpleGrid>
        ) : products.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No products match your search.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </SimpleGrid>
        )}

        {isFetching && (
          <Text size="xs" c="dimmed" ta="center">
            Updating catalog…
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
