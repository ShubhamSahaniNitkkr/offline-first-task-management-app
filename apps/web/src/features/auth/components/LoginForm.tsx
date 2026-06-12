import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Box,
  Code,
  Group,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { loginSchema, type LoginInput } from '@oftmp/shared';
import { useLoginMutation } from '../../../store/api/index.js';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';

export function LoginForm() {
  const [login, { isLoading, error }] = useLoginMutation();
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });

  const submitLogin = async (data: LoginInput) => {
    setLoginError(null);
    try {
      await login(data).unwrap();
      window.location.href = '/dashboard';
    } catch {
      setLoginError('Invalid email or password');
    }
  };

  const fillDemoAndLogin = () => {
    setValue('email', DEMO_EMAIL);
    setValue('password', DEMO_PASSWORD);
    void submitLogin({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  };

  return (
    <Box className="login-page">
      <Paper className="login-card" p="xl" radius="lg" withBorder maw={420} w="100%" mx="md">
        <form onSubmit={handleSubmit(submitLogin)}>
          <Stack gap="lg">
            <Stack gap={4}>
              <Title className="brand-mark" order={2}>
                Shubham Sunny <span>Shop</span>
              </Title>
              <Text size="sm" c="dimmed">
                Sign in to start shopping
              </Text>
            </Stack>

            <Alert
              variant="light"
              color="brand"
              icon={<IconUser size={18} />}
              title="Demo account — use to test the app"
            >
              <Stack gap={6}>
                <Group gap="xs" wrap="wrap">
                  <Text size="sm" fw={500}>
                    Email:
                  </Text>
                  <Code>{DEMO_EMAIL}</Code>
                </Group>
                <Group gap="xs" wrap="wrap">
                  <Text size="sm" fw={500}>
                    Password:
                  </Text>
                  <Code>{DEMO_PASSWORD}</Code>
                </Group>
              </Stack>
            </Alert>

            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              size="md"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextInput
              label="Password"
              type="text"
              autoComplete="current-password"
              size="md"
              error={errors.password?.message}
              {...register('password')}
            />

            {(loginError || error) && (
              <Alert color="red" variant="light" role="alert">
                {loginError ?? 'Login failed'}
              </Alert>
            )}

            <Button type="submit" color="brand" loading={isLoading} fullWidth size="md">
              Sign in
            </Button>

            <Button
              type="button"
              variant="light"
              color="brand"
              fullWidth
              size="md"
              loading={isLoading}
              onClick={fillDemoAndLogin}
            >
              Quick login as demo user
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
