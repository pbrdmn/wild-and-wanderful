/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO: Re-add vite-plugin-pwa once it supports Vite 8
// See: https://github.com/vite-pwa/vite-plugin-pwa

export default defineConfig({
  plugins: [
    react(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
  },
})
