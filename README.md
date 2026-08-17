# Openlyst

Welcome to the Openlyst project! 

Openlyst is an open-source project discovery engine built with React, Vite, Express, and SQLite. It provides a beautiful interface to discover, categorize, and track trending repositories using the GitHub API.

## Architecture

- **Frontend:** React & Vite
- **Backend:** Express API (Local Runtime)
- **Database:** SQLite (`better-sqlite3`)
- **Integration:** GitHub REST API

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create an `.env.local` file in the root directory based on the `.env.example` template:

```env
# Create a GitHub Personal Access Token and add it here for API access
GITHUB_TOKEN=your_github_personal_access_token

# (Optional) SMTP Credentials for the Contact form email dispatch
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=reviewzxone@gmail.com
SMTP_PASS=your_16_letter_app_password
```

### Running the App

Start the full stack (Frontend & Backend + SQLite) using the unified dev script:

```bash
npm run dev
```

The application will start concurrently:
- **Express Backend:** Running on `http://localhost:3001`
- **Vite Frontend:** Running on `http://localhost:5173`

Navigate to `http://localhost:5173` in your browser to view the app!

### Database Management

The SQLite database is stored locally in the `data/` directory.

- Reset the database:
  ```bash
  npm run db:reset
  ```

## Publishing & Deployment

Build the optimized production bundle for the frontend:
```bash
npm run build
```
This generates static files in the `dist/` directory that can be served by any static hosting provider, while the Node backend runs separately.
