import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { store } from '../store/index.js';
import { LoginForm } from '../features/auth/components/LoginForm.js';
import { appTheme } from '../lib/theme.js';

export function LoginApp() {
  return (
    <Provider store={store}>
      <MantineProvider theme={appTheme} forceColorScheme="light">
        <Notifications position="top-right" />
        <LoginForm />
      </MantineProvider>
    </Provider>
  );
}
