<div align="center">
  <img src="public/logo.png" alt="Openlysts Logo" width="120" height="120" />
  
  # Openlysts
  
  **The Ultimate Open-Source Discovery Engine**

  <p align="center">
    <img src="https://img.shields.io/badge/Version-v1.3.0-8b5cf6?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/Build-Passing-3b82f6?style=for-the-badge" alt="Build" />
    <img src="https://img.shields.io/badge/Tests-9%2F9%20Pass-10b981?style=for-the-badge" alt="Tests" />
    <img src="https://img.shields.io/badge/Status-Production%20Ready-f59e0b?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" alt="License" />
  </p>

  <p align="center">
    <em>Stop endlessly scrolling through noisy search results.<br/>Discover, compare, track, and master the highest-quality open-source software—all in one unified ecosystem.</em>
  </p>
</div>

---

<div align="center">
  <img src="public/banner.jpg" alt="Openlysts Banner" width="800" style="border-radius: 12px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);" />
</div>

---

## ✨ Everything Openlysts Can Do

Openlysts is a complete intelligence platform for developers, tech leads, and open-source enthusiasts:

- 🪪 **Interactive 3D Holographic Dev Pass**: Gamified developer identity pass dynamically customizing in real time as you select your role track (`Fullstack`, `AI / ML`, `DevOps`, `Systems`, `OSS Builder`) with Genesis Pioneer credentials.
- ⚡ **100% Free Autonomous Edge Engine**: Sub-millisecond in-memory JSON catalog engine resolving 47,000+ repositories with zero database queries.
- 🚀 **Trending & Velocity Feed**: Real-time project momentum tracking with customizable time windows (Daily, 7-Day, 30-Day) and automatic background synchronization via Vercel Cron.
- 🧠 **Hybrid Similarity Engine**: Algorithmic discovery fusing semantic topic relevance, authority scoring (stars/adoption), and developer engagement (forks/issues) to surface canonical projects.
- 🔍 **Spotlight Search & Command Palette**: Instant navigation via keyboard (`⌘ + K` / `Ctrl + K`) with deep query parameter synchronization and live debounce.
- 🔢 **Live AnimateDigits Rolling Tickers & Unlumen Social Hover Bar**: Real-time odometer telemetry tracking `35,476` rated projects and interactive morphing popovers.
- 🆚 **SaaS-to-Open-Source Alternatives**: Curated directory of self-hosted alternatives with real-world feature parity scoring, cost breakdowns, and active community benchmarks with sub-50ms instant switching.
- ⚖️ **Side-by-Side Comparison Matrix**: Compare up to 5 repositories simultaneously across stars, velocity, commit frequency, licenses, dependencies, and health metrics with shareable URL links.
- 🎬 **Ultra-Fast Video Tutorials & Walkthroughs Engine**: Multi-tier persistent caching, client hover pre-fetching, and query normalization for instantaneous sub-millisecond YouTube explainer popovers.
- 📐 **Pixel-Uniform Equal-Height Discovery Grid**: Flexbox-equalized grid rows ensuring deterministic card heights, uniform descriptions, and pinned metrics across responsive breakpoints.
- 🧑‍💻 **Interactive 3D Reactive Founder Avatar & Support Desk**: Cursor-tracking 3D avatar with eyelid winks, cheek smiles, particle reactions, and seamless Contact Portal routing.
- 📊 **Deep Health & Maintenance Insights**: Direct GitHub integration inspecting release cadences, license legitimacy, community health, and full rendered markdown READMEs.
- 🎨 **Multi-Theme Design Engine & Fluid Physics**: Dynamic theme switching with 14+ GPU-accelerated WebGL shaders (Aurora, Plasma, Liquid Noise) and Framer Motion spring physics governing all interactive modals and drawers.
- 📈 **Recharts Data Visualizations**: Animated `AreaChart` and `ScoreRing` metrics rendering GitHub historical star velocity and benchmark scoring with gradient aesthetics.
- 💾 **Local & Cloud Bookmarking**: Instant offline bookmarking with real-time mobile badge synchronization and JSON export in the user Data Vault.
- 📲 **Progressive Web App (PWA)**: Full offline service-worker caching, installable on macOS, Windows, iOS, and Android.
- 🔐 **Pure Enterprise Auth & Profile Management**: Email/password, Google & GitHub OAuth2, secure session cookies (`connect-pg-simple`), and 3D card tilt authentication.
- 🚫 **Unified Global Product Tour Suppression**: Permanent single-click dismissal with zero navigation popup loops.

---

## 🏗️ Architecture & Tech Stack

Openlysts is built using modern web standards for 60FPS performance, responsive agility, and security:

### Frontend
- **React 18** + **Vite**: Sub-millisecond HMR and tree-shaken production bundles.
- **Tailwind CSS**: Utility-first styling with design system tokens and glassmorphism.
- **Framer Motion & Three.js / OGL**: Interactive 3D particle hero effects and fluid transitions.
- **TanStack React Query (v5)**: Multi-layer caching and background polling.
- **Vaul & Radix UI**: Accessible slide-over drawers, modals, and mobile bottom sheets.
- **Lucide React**: Crisp, modern iconography.

### Backend & Database
- **Express.js (Node.js)**: REST APIs, custom RPC functions, and automated background workers.
- **In-Memory Catalog Engine**: 100% free, zero-latency custom JSON inverted index engine running entirely in RAM.
- **Vercel Cron**: Fully autonomous, zero-intervention daily ingestion pipelines.
- **PostgreSQL (Neon)**: Used strictly for lightweight auxiliary features (Alternatives sync, Users, Bookmarks) to preserve free-tier bandwidth.
- **GitHub REST API & YouTube Services**: Live repository data feeds and educational video integration.

---

## 🚦 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+) and **npm**
- **PostgreSQL** database connection string (we recommend [Neon](https://neon.tech))

### 2. Installation
```bash
git clone https://github.com/openlysts/Openlysts.git
cd openlyst
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Database Connection String (Neon PostgreSQL)
DATABASE_URL="postgres://user:password@hostname/dbname?sslmode=require"

# GitHub Personal Access Token for Ingestion & Live Metrics
GITHUB_TOKEN=your_github_token

# Session Secret (min 32 characters)
SESSION_SECRET=your_super_secret_session_key

# Optional OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret

# Optional SMTP Credentials for Email Resets & Contact
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=openlysts@gmail.com
SMTP_PASS=your_app_password
```

### 4. Launch Locally 🚀
```bash
npm run dev
```
- 🎨 **Frontend**: `http://localhost:5173`
- ⚙️ **Backend API**: `http://localhost:3001`

---

## 🧪 Quality Assurance & Test Verification

Openlysts runs an automated regression suite with Playwright:

```bash
# Run full static checks
npm run lint
npm run typecheck
npm run build

# Run automated cross-device Playwright test suite
npx playwright test
```

---

## 🌿 Branch Architecture & Deployment

Openlysts strictly follows a 4-branch workflow:
- **`experimental`**: Active working branch for features and bug fixes.
- **`dev`**: Staging branch for integration testing.
- **`main`**: Production release branch. **All Vercel deployments strictly originate from `main`.**
- **`backup`**: Rollback snapshot for disaster recovery.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <b>Built with ❤️ for the open-source developer ecosystem.</b>
</div>
