<div align="center">
  <img src="public/logo.png" alt="Openlysts Logo" width="120" height="120" />
  
  # 🌐 Openlysts
  
  **The Ultimate Open-Source Discovery Engine**

  <p align="center">
    <a href="https://github.com/Adilrafiq001/Openlyst/stargazers"><img src="https://img.shields.io/github/stars/Adilrafiq001/Openlyst?style=for-the-badge&color=8b5cf6" alt="Stars" /></a>
    <a href="https://github.com/Adilrafiq001/Openlyst/network/members"><img src="https://img.shields.io/github/forks/Adilrafiq001/Openlyst?style=for-the-badge&color=3b82f6" alt="Forks" /></a>
    <a href="https://github.com/Adilrafiq001/Openlyst/issues"><img src="https://img.shields.io/github/issues/Adilrafiq001/Openlyst?style=for-the-badge&color=f59e0b" alt="Issues" /></a>
    <a href="https://github.com/Adilrafiq001/Openlyst/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Adilrafiq001/Openlyst?style=for-the-badge&color=10b981" alt="License" /></a>
  </p>

  <p align="center">
    <em>Stop endlessly scrolling through noisy search results.<br/>Discover, compare, and track the highest-quality open-source software—all in one stunning ecosystem.</em>
  </p>
</div>

---

<div align="center">
  <!-- PLACEHOLDER FOR DEMO GIF -->
  <!-- 💡 Tip: Record a quick screen capture of the app in action and place it here! -->
  <img src="https://raw.githubusercontent.com/Adilrafiq001/Openlyst/main/public/demo.gif" alt="Openlysts App Demo GIF" width="800" style="border-radius: 12px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);" onerror="this.src='https://placehold.co/800x450/1a1b26/8b5cf6?text=Upload+demo.gif+to+show+your+app+in+action!'"/>
</div>

---

## ✨ Features

- 🚀 **Trending & Hot Projects**: A continuously updated feed of repositories gaining momentum right now.
- 🔍 **Lightning-Fast Search**: Press `⌘ + K` to instantly access our Spotlight-style command palette for quick navigation.
- 🆚 **Smart Alternatives**: Find high-quality, self-hosted open-source alternatives to expensive SaaS products with direct feature comparisons.
- 📊 **Deep Insights**: View repository health, maintenance activity, contributor stats, and quality scores at a glance.
- 🎨 **Multiple Gorgeous Themes**: Personalize your experience with built-in themes including Dark, Light, Ocean, Dracula, Forest, and more.
- 💾 **Local Bookmarks**: Save your favorite projects locally without needing to create an account.
- 🛠️ **Local-First Architecture**: Powered entirely by a lightweight, standalone SQLite + Express backend.

---

## 🏗️ Architecture & Tech Stack

Openlysts is built using modern web technologies to ensure a blazing fast, resilient, and beautiful user experience:

### Frontend
- **React 18** + **Vite**: For instantaneous HMR and optimized production builds.
- **Tailwind CSS**: For utility-first styling, glassmorphism, and responsive design.
- **Framer Motion**: For buttery-smooth micro-interactions, 3D particles, and page transitions.
- **Lucide React**: For crisp, scalable iconography.

### Backend & Database
- **Express.js**: Providing robust REST APIs and background jobs for GitHub ingestion.
- **SQLite3** (`better-sqlite3`): A zero-config, highly-performant local database storing our entity maps.
- **GitHub REST API**: For fetching live repository metrics, licenses, and README files.

---

## 🚦 Quick Start Guide

Want to run Openlysts locally on your own machine? It takes less than 3 minutes.

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed.

### 2. Installation
Clone the repository and install the required dependencies:
```bash
git clone https://github.com/Adilrafiq001/Openlyst.git
cd Openlyst
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory based on the `.env.example` template:

```env
# REQUIRED: Your GitHub Personal Access Token for API access
GITHUB_TOKEN=your_github_personal_access_token

# OPTIONAL: SMTP Credentials for the Contact form email dispatch
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=reviewzxone@gmail.com
SMTP_PASS=your_16_letter_app_password
```

### 4. Blast Off 🚀
Start the unified full-stack dev server:
```bash
npm run dev
```
The application will launch concurrently:
- 🎨 **Vite Frontend:** `http://localhost:5173`
- ⚙️ **Express Backend:** `http://localhost:3001`

Open [http://localhost:5173](http://localhost:5173) in your browser to experience Openlysts!

---

## 🗄️ Database Management

The SQLite database is stored locally in the `data/` directory. It initializes itself automatically on the first run.

If you ever need to reset the database to a completely clean slate:
```bash
npm run db:reset
```

---

## 📸 Screenshots

<details>
<summary><b>Click to view UI Screenshots</b></summary>
<br/>

*Placeholders for your stunning UI screenshots:*

| Discover Feed | Alternatives Compare |
|:---:|:---:|
| <img src="https://placehold.co/400x250/1a1b26/3b82f6?text=Discover+Feed" alt="Discover Feed"/> | <img src="https://placehold.co/400x250/1a1b26/10b981?text=Alternatives+Compare" alt="Alternatives View"/> |

| 3D Welcome Screen | Project Insights |
|:---:|:---:|
| <img src="https://placehold.co/400x250/1a1b26/8b5cf6?text=3D+Welcome+Screen" alt="Welcome Screen"/> | <img src="https://placehold.co/400x250/1a1b26/f59e0b?text=Project+Insights" alt="Insights View"/> |

</details>

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
