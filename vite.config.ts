import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Prevent accidental client bundling of server-only Admin SDK
      'firebase-admin': '/dev/null',
      'firebase-admin/app': '/dev/null',
      'firebase-admin/firestore': '/dev/null',
    },
  },
})