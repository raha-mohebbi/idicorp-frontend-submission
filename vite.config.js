
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://ts.idicorp.ir',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: '',
      },
      '/ws': {
        target: 'wss://ts.idicorp.ir',
        changeOrigin: true,
        ws: true,
        secure: true,
      },
    },
  },
})
