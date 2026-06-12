import { lazy, Suspense, useMemo, useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import {
  MantineProvider,
  AppShell,
  Burger,
  Group,
  Button,
  Loader,
  Center,
  Badge,
  Box,
  Drawer,
  Stack,
  Container,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import {
  IconShoppingBag,
  IconHeart,
  IconPackage,
  IconSettings,
  IconLogout,
  IconBuildingStore,
} from '@tabler/icons-react';
import { useLiveQuery } from 'dexie-react-hooks';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { store } from '../store/index.js';
import { initPreferences } from '../offline/db/database.js';
import { useSyncStatus } from '../features/sync/hooks/useSyncStatus.js';
import { SyncStatusBanner, OfflineBanner } from '../features/sync/components/SyncStatusBanner.js';
import { OfflineModeToggle } from '../features/sync/components/OfflineModeToggle.js';
import { OfflineProcessCard } from '../features/sync/components/OfflineProcessCard.js';
import { useLogoutMutation } from '../store/api/index.js';
import { PageErrorBoundary } from '../components/ErrorBoundary.js';
import { appTheme } from '../lib/theme.js';
import { db } from '../offline/db/database.js';
const ShopHome = lazy(() =>
  import('../features/shop/components/ShopHome.js').then((m) => ({ default: m.ShopHome })),
);
const CartPage = lazy(() =>
  import('../features/cart/components/CartPage.js').then((m) => ({ default: m.CartPage })),
);
const WishlistPage = lazy(() =>
  import('../features/wishlist/components/WishlistPage.js').then((m) => ({ default: m.WishlistPage })),
);
const OrdersPage = lazy(() =>
  import('../features/orders/components/OrdersPage.js').then((m) => ({ default: m.OrdersPage })),
);
const SettingsPanel = lazy(() =>
  import('../features/settings/components/SettingsPanel.js').then((m) => ({
    default: m.SettingsPanel,
  })),
);

type ViewId = 'shop' | 'cart' | 'wishlist' | 'orders' | 'settings';

const NAV: { id: ViewId; label: string; icon: typeof IconBuildingStore }[] = [
  { id: 'shop', label: 'Shop', icon: IconBuildingStore },
  { id: 'cart', label: 'Cart', icon: IconShoppingBag },
  { id: 'wishlist', label: 'Wishlist', icon: IconHeart },
  { id: 'orders', label: 'Orders', icon: IconPackage },
  { id: 'settings', label: 'Settings', icon: IconSettings },
];

function CartBadge() {
  const count = useLiveQuery(() => db.cartItems.count(), []) ?? 0;
  if (!count) return null;
  return (
    <Badge size="sm" circle color="brand" variant="filled">
      {count}
    </Badge>
  );
}

function WishlistBadge() {
  const count = useLiveQuery(() => db.wishlistItems.count(), []) ?? 0;
  if (!count) return null;
  return (
    <Badge size="sm" circle color="pink" variant="filled">
      {count}
    </Badge>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV)[0];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`header-nav-link${active ? ' header-nav-link--active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <item.icon size={16} aria-hidden />
      {item.label}
      {item.id === 'cart' && <CartBadge />}
      {item.id === 'wishlist' && <WishlistBadge />}
    </button>
  );
}

function AppShellLayout({ initialView }: { initialView: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewId>((initialView as ViewId) || 'shop');
  useSyncStatus();
  const [logout] = useLogoutMutation();

  const goTo = (view: ViewId) => {
    setActiveView(view);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const content = useMemo(() => {
    switch (activeView) {
      case 'shop':
        return <ShopHome />;
      case 'cart':
        return <CartPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'orders':
        return <OrdersPage />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <ShopHome />;
    }
  }, [activeView]);

  return (
    <AppShell header={{ height: 70 }} padding={0} className="app-shell">
      <AppShell.Header className="app-header">
        <Container size="xl" h="100%" px={{ base: 'sm', sm: 'md' }}>
          <Group h="100%" justify="space-between" wrap="nowrap" gap="xs" className="app-header__inner">
            <Group gap="sm" wrap="nowrap" className="app-header__left">
              <Burger
                opened={drawerOpen}
                onClick={() => setDrawerOpen((o) => !o)}
                hiddenFrom="md"
                aria-label="Open menu"
                size="sm"
              />
              <Box className="brand-mark" component="span">
                <span className="brand-mark__desktop">
                  Shubham Sunny <span className="brand-mark__accent">Shop</span>
                </span>
                <span className="brand-mark__mobile">
                  <span className="brand-mark__mobile-line">Shubham Sunny</span>
                  <span className="brand-mark__mobile-line brand-mark__accent">Shop</span>
                </span>
              </Box>
              <Group gap={4} visibleFrom="md">
                {NAV.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    active={activeView === item.id}
                    onClick={() => goTo(item.id)}
                  />
                ))}
              </Group>
            </Group>
            <Group gap="xs" wrap="nowrap" className="app-header__right">
              <OfflineModeToggle />
              <Button
                size="sm"
                variant="default"
                className="header-logout-btn"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
                aria-label="Logout"
              >
                <span className="header-logout-btn__label">Logout</span>
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Shubham Sunny Shop"
        padding="md"
        hiddenFrom="md"
      >
        <Stack gap="xs" className="mobile-nav-drawer">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => goTo(item.id)}
            />
          ))}
        </Stack>
      </Drawer>

      <AppShell.Main id="main-content" className="app-main">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Container size="xl" py="lg" px="md">
          <OfflineBanner />
          <div className="offline-process-sticky">
            <OfflineProcessCard />
          </div>
          <SyncStatusBanner />
          <PageErrorBoundary>
            <Suspense
              fallback={
                <Center h={240}>
                  <Loader color="brand" aria-label="Loading" />
                </Center>
              }
            >
              {content}
            </Suspense>
          </PageErrorBoundary>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

interface AppProvidersProps {
  initialView?: string;
}

export function AppProviders({ initialView = 'shop' }: AppProvidersProps) {
  useEffect(() => {
    void initPreferences();
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  }, []);

  return (
    <Provider store={store}>
      <MantineProvider theme={appTheme} forceColorScheme="light">
        <Notifications position="top-right" />
        <AppShellLayout initialView={initialView} />
      </MantineProvider>
    </Provider>
  );
}
