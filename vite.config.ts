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
        'favicon.png',
        'manifest.json',
        'robots.txt',
        'screenshot.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,txt}'],
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
