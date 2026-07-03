import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Added the import here

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Moved inside the plugins array,
    // base: "https://github.com/baloguntoluwalope/wakaCharge"
  ],
  base: "https://github.com/baloguntoluwalope/wakaCharge"
})