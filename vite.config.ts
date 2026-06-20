import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/logo.png', 'assets/hero/**/*'],
      manifest: {
        name: 'PT Perdana Adi Yuda — Portal Rekrutmen',
        short_name: 'Perdana',
        description: 'Portal rekrutmen dan layanan tenaga kerja PT Perdana Adi Yuda',
        theme_color: '#003087',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: '/assets/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      external: ['firebase-admin', 'firebase-admin/app', 'firebase-admin/firestore'],
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('@google/genai')) return 'vendor-genai';
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('motion')) return 'vendor-motion';
          if (id.includes('leaflet')) return 'vendor-leaflet';
          if (id.includes('react-router') || id.includes('react-dom') || /\/react\//.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('@heroicons') || id.includes('lucide-react')) return 'vendor-icons';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});