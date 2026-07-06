import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },

  server: {
    port: 3000,
    strictPort: true,
    // Vite's dev server already falls back to index.html
    // for unmatched routes by default — no config needed.
  },

  build: {
    outDir: 'dist',
    // Smaller chunks = faster first load
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core — always needed
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/')) {
            return 'react-core'
          }
          // Router — needed early
          if (id.includes('react-router-dom')) {
            return 'router'
          }
          // React Query — needed early
          if (id.includes('@tanstack')) {
            return 'query'
          }
          // Animation — can load slightly later
          if (id.includes('framer-motion')) {
            return 'motion'
          }
          // Charts — admin only, load last
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts'
          }
          // Icons — big, split out
          if (id.includes('react-icons')) {
            return 'icons'
          }
          // Form utils
          if (id.includes('react-hook-form') ||
              id.includes('@hookform') ||
              id.includes('zod')) {
            return 'forms'
          }
        },
      },
    },
    // Enable minification
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps only in dev
    sourcemap: false,
  },

  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'framer-motion',
    ],
    exclude: ['recharts'],
  },
})