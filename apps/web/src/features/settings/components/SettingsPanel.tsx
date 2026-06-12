import { Stack, Switch, Title, NumberInput, Text, Paper } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../offline/db/database.js';

export function SettingsPanel() {
  const preferences = useLiveQuery(() => db.userPreferences.get('default'));

  const updatePreferences = async (updates: Partial<NonNullable<typeof preferences>>) => {
    const current = (await db.userPreferences.get('default'))!;
    await db.userPreferences.put({ ...current, ...updates });
  };

  return (
    <Stack gap="lg" maw={520}>
      <Title order={2} fw={700}>
        Settings
      </Title>

      <Paper p="lg" radius="lg" withBorder>
        <Title order={4} fw={600} mb="md">
          Notifications
        </Title>
        <Stack gap="sm">
          <Switch
            label="Sync started"
            checked={preferences?.notifications.syncStarted ?? true}
            onChange={(e) =>
              updatePreferences({
                notifications: {
                  ...preferences!.notifications,
                  syncStarted: e.currentTarget.checked,
                },
              })
            }
          />
          <Switch
            label="Sync completed"
            checked={preferences?.notifications.syncCompleted ?? true}
            onChange={(e) =>
              updatePreferences({
                notifications: {
                  ...preferences!.notifications,
                  syncCompleted: e.currentTarget.checked,
                },
              })
            }
          />
          <Switch
            label="Sync failed"
            checked={preferences?.notifications.syncFailed ?? true}
            onChange={(e) =>
              updatePreferences({
                notifications: {
                  ...preferences!.notifications,
                  syncFailed: e.currentTarget.checked,
                },
              })
            }
          />
          <Switch
            label="Offline mode alerts"
            checked={preferences?.notifications.offlineMode ?? true}
            onChange={(e) =>
              updatePreferences({
                notifications: {
                  ...preferences!.notifications,
                  offlineMode: e.currentTarget.checked,
                },
              })
            }
          />
        </Stack>
      </Paper>

      <Paper p="lg" radius="lg" withBorder>
        <Title order={4} fw={600} mb="md">
          Sync
        </Title>
        <Stack gap="sm">
          <Switch
            label="Auto-sync when online"
            checked={preferences?.sync.autoSync ?? true}
            onChange={(e) =>
              updatePreferences({
                sync: { ...preferences!.sync, autoSync: e.currentTarget.checked },
              })
            }
          />
          <NumberInput
            label="Sync interval (seconds)"
            min={10}
            max={300}
            value={preferences?.sync.intervalSeconds ?? 30}
            onChange={(v) =>
              updatePreferences({
                sync: { ...preferences!.sync, intervalSeconds: Number(v) || 30 },
              })
            }
          />
        </Stack>
      </Paper>

      <Text size="xs" c="dimmed">
        Shubham Sunny Shop uses a light interface optimized for readability.
      </Text>
    </Stack>
  );
}
