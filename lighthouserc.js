/**
 * Lighthouse CI Configuration for Openlysts
 * Enforces Core Web Vitals and performance budgets
 *
 * Usage:
 *   npx lighthouse-ci autorun
 *   npm run audit:lighthouse
 */

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/discover',
        'http://localhost:5173/settings',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox',
        preset: 'desktop',
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance
        'categories:performance': ['error', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.7 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 5000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],

        // Bundle size
        'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100000 }], // 100KB

        // Resources
        'resource-summary:third-party:count': ['warn', { maxNumericValue: 10 }],
        'dom-size': ['warn', { maxNumericValue: 1500 }],

        // Specific audits
        'uses-long-cache-ttl': 'off', // Vercel handles caching
        'uses-http2': 'off', // Vercel uses HTTP/2
        'render-blocking-resources': ['warn', { maxNumericValue: 2000 }],
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './reports/lighthouse',
      filenamePattern: '{hostname}-{datetime}-{browser}-{strategy}.{ext}',
    },
    server: {
      // For local dev server management
      startPort: 5173,
      lazy: true,
    },
  },
};
