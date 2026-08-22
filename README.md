<div align="center">
  <img src="public/logo.png" alt="Openlysts Logo" width="120" height="120" />
  
  # Openlysts
  
  **The Ultimate Open-Source Discovery Engine**

  <p align="center">
    <img src="https://img.shields.io/badge/Version-v1.1.0-8b5cf6?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/Build-Passing-3b82f6?style=for-the-badge" alt="Build" />
    <img src="https://img.shields.io/badge/Status-Active-f59e0b?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" alt="License" />
  </p>

  <p align="center">
    <em>Stop endlessly scrolling through noisy search results.<br/>Discover, compare, and track the highest-quality open-source software—all in one stunning ecosystem.</em>
  </p>
</div>

---

<div align="center">
  <img src="public/banner.jpg" alt="Openlysts Banner" width="800" style="border-radius: 12px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);" />
</div>

---

## ✨ Features

- 🚀 **Trending & Hot Projects**: A continuously updated feed of repositories gaining momentum right now.
- 🧠 **Hybrid Similarity Engine**: Advanced algorithmic sorting that weights repository authority and developer engagement alongside text relevance.
- 🔍 **Lightning-Fast Search**: Press `⌘ + K` to instantly access our Spotlight-style command palette for quick navigation.
- 🆚 **Smart Alternatives**: Find self-hosted open-source alternatives to expensive SaaS products with direct feature comparisons.
- ⚖️ **Side-by-Side Compare**: Select up to 3 repositories and compare stars, forks, license, language, and quality score in one view.
- 📊 **Deep Insights**: View repository health, maintenance activity, contributor stats, and quality scores at a glance.
- 🎨 **Multiple Gorgeous Themes**: Personalize your experience with built-in themes including Dark, Light, Ocean, Dracula, Forest, and more.
- 💾 **Local Bookmarks**: Save your favorite projects locally — no account required. Bookmark icon is on every card.
- 📲 **Progressive Web App (PWA)**: Installable on desktop and mobile. Works offline with full Service Worker caching.
- 🔐 **Full Authentication Suite**: Email/Password, Google OAuth, GitHub OAuth, email verification, and password resets.
- 🛡️ **Admin Dashboard**: Manage users, ingestion runs, audit logs, and repository studio from a secure admin panel.

---

## 🏗️ Architecture & Tech Stack

Openlysts is built using modern web technologies to ensure a blazing fast, resilient, and beautiful user experience:

### Frontend
- **React 18** + **Vite**: For instantaneous HMR and optimized production builds.
- **Tailwind CSS**: For utility-first styling, glassmorphism, and responsive design.
- **Framer Motion**: For buttery-smooth micro-interactions, 3D particles, and page transitions.
- **Lucide React**: For crisp, scalable iconography.

### Backend & Database
- **Express.js**: Providing robust REST APIs, authentication, and background jobs for GitHub ingestion.
- **PostgreSQL (Neon)**: The central source of truth for repository data, user accounts, and secure sessions.
- **GitHub REST API**: For fetching live repository metrics, licenses, and README files.

---

## 🚦 Quick Start Guide

Want to run Openlysts locally on your own machine? It takes less than 3 minutes.

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed. You will also need a PostgreSQL database (we recommend [Neon](https://neon.tech) for a free serverless Postgres instance).

### 2. Installation
Clone the repository and install the required dependencies:
```bash
git clone https://github.com/openlysts/Openlysts.git
cd Openlyst
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory based on the `.env.example` template:

```env
# REQUIRED: Your PostgreSQL Database Connection String
DATABASE_URL="postgres://user:password@hostname/dbname?sslmode=require"

# REQUIRED: Your GitHub Personal Access Token for API access
GITHUB_TOKEN=your_github_personal_access_token

# REQUIRED: For secure session management (min 32 chars)
SESSION_SECRET=your_super_secret_session_key

# OPTIONAL: OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret

# OPTIONAL: SMTP Credentials for the Contact form email dispatch & Password Resets
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=openlysts@gmail.com
SMTP_PASS=your_16_letter_app_password
```

### 4. Blast Off 🚀
Start the unified full-stack dev server:
```bash
npm run dev
```
The application will automatically initialize the database schema on startup and launch concurrently:
- 🎨 **Vite Frontend:** `http://localhost:5173`
- ⚙️ **Express Backend:** `http://localhost:3001`

Open [http://localhost:5173](http://localhost:5173) in your browser to experience Openlysts!

---

## 🗄️ Database Management

The application connects to your configured PostgreSQL database via the `DATABASE_URL`. The schema is automatically initialized on the first run. For production, Openlysts expects a unified environment (local dev runs against the same schema model).

---

## 📸 Screenshots

<details>
<summary><b>Click to view UI Screenshots</b></summary>
<br/>

*Here is a closer look at the Openlysts user interface:*

| Discover Feed | Alternatives Compare |
|:---:|:---:|
| <img src="public/screenshots/discover.png" alt="Discover Feed"/> | <img src="public/screenshots/alternatives.png" alt="Alternatives View"/> |

| 3D Welcome Screen | Project Insights |
|:---:|:---:|
| <img src="public/screenshots/welcome.png" alt="Welcome Screen"/> | <img src="public/screenshots/insights.png" alt="Insights View"/> |

</details>

---

## 🌿 Branch Architecture & Deployment

Openlysts enforces a multi-branch workflow for isolated development and reliable production releases:
- **`experimental`**: The active working branch for new features and iterative updates.
- **`dev`**: The staging branch for integration testing.
- **`main`**: The official production branch. **All Vercel production deployments are strictly and exclusively deployed from `main`.**
- **`backup`**: Rollback snapshot branch for disaster recovery.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <b>Built with ❤️ for the open-source community.</b>
</div>
