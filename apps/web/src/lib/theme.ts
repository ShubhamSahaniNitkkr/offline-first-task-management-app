import { createTheme } from '@mantine/core';

export const appTheme = createTheme({
  primaryColor: 'brand',
  defaultRadius: 'lg',
  fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '700',
  },
  colors: {
    brand: [
      '#eef4ff',
      '#dce8ff',
      '#b8d0ff',
      '#8ab4ff',
      '#5c96f7',
      '#3b7ded',
      '#2563eb',
      '#1d4ed8',
      '#1e40af',
      '#1e3a8a',
    ],
    surface: [
      '#ffffff',
      '#fafbfc',
      '#f4f6f8',
      '#eef1f5',
      '#e8ecf1',
      '#dfe4ea',
      '#d1d8e0',
      '#b8c2cc',
      '#94a3b8',
      '#64748b',
    ],
  },
  white: '#ffffff',
  black: '#0f172a',
  shadows: {
    xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
    sm: '0 2px 8px rgba(15, 23, 42, 0.06)',
    md: '0 4px 20px rgba(15, 23, 42, 0.08)',
    lg: '0 12px 40px rgba(15, 23, 42, 0.1)',
  },
  components: {
    Card: {
      defaultProps: { shadow: 'sm', radius: 'lg', withBorder: true, bg: 'white' },
    },
    Button: {
      defaultProps: { radius: 'md' },
    },
    Paper: {
      defaultProps: { radius: 'lg', bg: 'white' },
    },
    AppShell: {
      styles: {
        main: { backgroundColor: '#f8fafc' },
        header: { backgroundColor: 'rgba(255,255,255,0.92)' },
      },
    },
  },
});
