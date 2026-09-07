# Contributing to Openlysts

Thank you for your interest in contributing to Openlysts! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/Openlysts.git
   cd Openlysts
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/openlysts/Openlysts.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local configuration
   ```

## Development Setup

### Prerequisites

- **Node.js** 20+ (check `.nvmrc`)
- **PostgreSQL** (Neon or local)
- **npm** (package manager)

### Running Locally

```bash
# Start both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development servers |
| `npm run build` | Build for production (Vite) |
| `npm run lint` | Run ESLint across codebase |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run core services & invariant tests |
| `npm run test:api` | Run API route integration tests |
| `npm run test:e2e` | Run Playwright E2E physical browser tests |
| `npm run audit:secrets` | Run cross-platform git secrets scanner |
| `npm audit` | Run npm vulnerability audit |
| `npm run audit:quick` | Run quick code audit |
| `npm run audit:security` | Run security test suite |

## Project Structure

```
openlysts/
├── src/                    # Frontend (React)
│   ├── components/         # UI components
│   │   ├── openlyst/       # Domain-specific components
│   │   └── ui/             # Shared UI primitives
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities, API client, auth
│   └── api/                # API client layer
├── server/                 # Backend (Express 5)
│   ├── api/                # Route handlers
│   ├── auth/               # Authentication logic
│   ├── db/                 # Database schema and queries
│   ├── services/           # Business logic services
│   ├── functions/          # Serverless functions
│   └── shared/             # Shared utilities
├── tests/                  # Test suites
│   ├── e2e/                # Playwright E2E tests
│   └── fixtures/           # Test data
├── scripts/                # Utility scripts
│   ├── audit/              # Audit automation
│   ├── auth/               # Auth utilities
│   ├── db/                 # Database utilities
│   └── tests/              # Test utilities
├── .agents/                # Agent configuration
│   ├── skills/             # Agent skills (34 total)
│   └── rules/              # Agent rules (12 total)
└── docs/                   # Documentation
```

## How to Contribute

### 1. Find or Create an Issue

- Check existing [issues](https://github.com/openlysts/openlysts/issues)
- Create a new issue if none exists
- Comment on the issue to claim it

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

**Branch naming convention:**
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `refactor/` — Code refactoring
- `test/` — Adding tests
- `chore/` — Maintenance tasks

### 3. Make Changes

- Follow the [coding standards](#coding-standards)
- Write tests for new functionality
- Update documentation if needed
- Run `npm run lint` and `npm run typecheck` before committing

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request against the `dev` branch.

## Coding Standards

### General Rules

- **No AI slop** — Write clean, purposeful code
- **Minimal changes** — Only touch what's necessary
- **Follow existing patterns** — Match the codebase style
- **No secrets** — Never commit API keys, tokens, or passwords

### Frontend (React)

- Use functional components with hooks
- Follow `react-component-standards.md` rules
- Use `framer-motion` for animations
- Use `@/` alias for imports from `src/`
- Components in `src/components/`, pages in `src/pages/`

### Backend (Express 5)

- Follow `api-design-standards.md` rules
- Use parameterized SQL queries (never string concatenation)
- Return consistent error envelopes
- Validate input with Zod schemas
- Rate-limit sensitive endpoints

### Database

- Follow `database-query-standards.md` rules
- Use PostgreSQL quoted identifiers for case-sensitive columns
- Always use parameterized queries
- Test migrations before applying

### Security

- Follow `security-standards.md` rules
- Never expose secrets in client-side code
- Validate all user input
- Use bcrypt for passwords (12 rounds)
- Rate-limit authentication endpoints

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting (no code change)
- `refactor` — Code restructuring
- `test` — Adding tests
- `chore` — Maintenance
- `perf` — Performance improvement
- `ci` — CI/CD changes
- `build` — Build system changes

**Examples:**
```
feat(auth): add TOTP two-factor authentication

fix(api): prevent SQL injection in search endpoint

docs(readme): update installation instructions

test(auth): add rate limiting verification tests

chore(deps): update dependencies to latest versions
```

## Pull Request Process

### Before Submitting

1. **Update your branch**:
   ```bash
   git fetch upstream
   git rebase upstream/dev
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run test:api
   npm run audit:secrets
   npm audit
   npm run build
   ```

### PR Requirements

- [ ] **Title** follows conventional commit format
- [ ] **Description** explains what and why (not just what)
- [ ] **Tests** added for new functionality
- [ ] **Documentation** updated if needed
- [ ] **No console.log** statements left in code
- [ ] **No secrets** or sensitive data in diffs
- [ ] **Build passes** (`npm run build`)
- [ ] **Lint passes** (`npm run lint`)
- [ ] **Typecheck passes** (`npm run typecheck`)

### PR Template

```markdown
## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring
- [ ] Tests

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **At least 1 review** required from a maintainer
3. **Address feedback** promptly
4. **Squash and merge** (or rebase and merge)

## Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node.js version: [e.g., 20.11.0]

**Additional context**
Any other context about the problem.
```

## Requesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem. Ex. "I'm always frustrated when..."

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request.
```

## Questions?

- Open a [Discussion](https://github.com/openlysts/openlysts/discussions)
- Join our community channels
- Check the [README](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md)

---

Thank you for contributing to Openlysts! 🚀
