import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/demo/pocket-stamp-demo/create': {
        target: 'https://pocketstamp-wallet-backend-production.up.railway.app',
        changeOrigin: true,
        rewrite: () => '/join/pocket-stamp-demo',
      },
    },
  },
})
