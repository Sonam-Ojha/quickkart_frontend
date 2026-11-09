import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — cached aggressively; changes rarely
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react-vendor'
          }
          // Radix UI — large but stable
          if (id.includes('@radix-ui/')) {
            return 'radix-ui'
          }
          // TanStack — query + table
          if (id.includes('@tanstack/')) {
            return 'tanstack'
          }
          // Recharts + its deps (d3 etc.) — heavy, only used on dashboard
          if (id.includes('recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
            return 'charts'
          }
          // Firebase — large SDK, only used for push notifications
          if (id.includes('firebase')) {
            return 'firebase'
          }
          // xlsx is loaded dynamically (import('xlsx')) so it auto-splits already
        },
      },
    },
  },
})
