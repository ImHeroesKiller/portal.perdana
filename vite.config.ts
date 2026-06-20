import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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