import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/acnh_turnips/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-16.png',
        'favicon-32.png',
        'favicon-48.png',
        'favicon-96.png',
        'favicon-128.png',
        'favicon-152.png',
        'favicon-167.png',
        'favicon-180.png',
        'favicon-192.png',
        'favicon-196.png',
        'favicon-512.png',
        'favicon.png',
        'robots.txt',
        'screenshot.png',
      ],
      manifest: {
        name: 'Animal Crossing New Horizons Turnip Calculator',
        short_name: 'Turnip Calculator',
        description: 'Predict turnip prices and corner the stalk market in Animal Crossing New Horizons',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'favicon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'favicon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,txt}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  define: {
    'process.env.PUBLIC_URL': JSON.stringify('/acnh_turnips/'),
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/vitest-setup.ts'],
  },
});
