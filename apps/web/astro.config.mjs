import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  integrations: [react()],
  server: {
    port: 4321,
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: 'src/sw',
        filename: 'sw.ts',
        injectRegister: 'auto',
        manifest: {
          name: 'Shubham Sunny Shop',
          short_name: 'SS Shop',
          description: 'Shubham Sunny Shop — offline-first ecommerce',
          theme_color: '#228be6',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    define: {
      'import.meta.env.PUBLIC_API_URL': JSON.stringify(
        process.env.PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
      ),
    },
  },
});
