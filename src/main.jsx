import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@fontsource/mona-sans'
// Self-hosted variable fonts (subset woff2 fetched on demand) — replaces the
// previous Google Fonts @import of 7 families, only 2 of which were used.
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@/index.css'
import { initErrorTracking } from '@/lib/errorTracker'
import { initAccessibility } from '@/lib/accessibility'
import { getSettings } from '@/lib/settings'

// Global error reporting (window.onerror + unhandledrejection) -> admin dashboard
initErrorTracking()

// WCAG-AA preference engine: applies saved font-size / motion / contrast /
// focus settings to <html> before first paint and follows OS changes.
initAccessibility(getSettings)

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)