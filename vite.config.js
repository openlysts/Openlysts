import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    react(),
  ],
  optimizeDeps: {
    include: [
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'react-markdown',
      'canvas-confetti',
      '@marsidev/react-turnstile'
    ],
    exclude: ['react', 'react-dom']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'framer-motion', '@marsidev/react-turnstile'],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Letting Rollup handle chunking natively based on dynamic imports
      }
    }
  }
});