import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ◄ Added Tailwind v4 Compiler Plugin
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ◄ Compiles @theme blocks out before LightningCSS minifies
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },

  server: {
    port: 3001,
    strictPort: true,
  },

  css: {
    // Explicitly forces Vite/Rolldown to fallback to standard CSS transformers
    // if LightningCSS still complains about specific native CSS modules.
    transformer: 'postcss',
  },

  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 500,
    minify: 'esbuild', // Minifies JS chunks safely
    cssCodeSplit: true,
    sourcemap: false,
    
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