import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // lib/ and api/ are server-only; block accidental client imports
      external: ['firebase-admin', 'firebase-admin/app', 'firebase-admin/firestore'],
    },
  },
})