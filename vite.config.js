import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
  ],
  optimizeDeps: {
    // Pre-bundle every runtime import at startup so lazy page chunks never
    // trigger mid-session dep discovery + re-optimization. Re-optimization
    // produced a second react-router-dom chunk hash (?v=...) mid-session,
    // which left two Router contexts alive and crashed lazy routes
    // ("useNavigate must be used within a Router" on /discover).
    include: [
      'react-router',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'react-markdown',
      'canvas-confetti',
      '@marsidev/react-turnstile',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'cmdk',
      'date-fns',
      'embla-carousel-react',
      'input-otp',
      'lodash/throttle',
      'react-hook-form',
      'react-joyride',
      'react-day-picker',
      'react-resizable-panels',
      'recharts',
      'rehype-highlight',
      'rehype-raw',
      'three',
      'ogl',
      'vaul'
    ],
    exclude: ['framer-motion'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // NOTE: do not alias react/react-dom to absolute paths — doing so splits
    // React across two optimization passes (pre-bundled deps vs raw ESM like
    // framer-motion), leaving two live React cores that crash Radix hooks
    // with "Cannot read properties of null (reading 'useMemo')".
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/preview': 'http://localhost:3001'
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunk split: keeps one React instance per family, avoids
        // megabyte single bundles, and lets browsers cache rarely-changed vendor
        // chunks across deploys. React/router/query stay together so there is
        // exactly one shared React module graph in every page bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') ||
            id.includes('/react-router') || id.includes('/@tanstack/') || id.includes('/use-sync-external-store/')
          ) return 'react-vendor'
          if (id.includes('/framer-motion/')) return 'motion'
          // NOTE: no dedicated recharts/d3 bucket — a manual chunk was surfacing
          // as an INITIAL preload on every page even though recharts is only
          // imported by lazy routes (RepoDetail/Compare/Admin). Rollup auto-splits
          // shared deps of lazy chunks without forcing them into the entry graph.
          if (id.includes('/three/') || id.includes('/ogl/')) return 'three'
          if (id.includes('/@radix-ui/')) return 'radix-ui'
          if (id.includes('/lucide-react/')) return 'icons'
          // NOTE: no catch-all 'vendor' chunk — grouping every remaining dep into
          // one chunk made modules used ONLY by lazy routes (react-markdown,
          // rehype, highlight.js, …) eagerly preload on the entry page because
          // lodash/throttle (used by the layout) shared the same bucket.
          return undefined
        },
      }
    }
  }
});
