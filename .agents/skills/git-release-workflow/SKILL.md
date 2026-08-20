---
name: git-release-workflow
description: "SOP for multi-branch Git synchronization, production releases, and forced Vercel deployments."
---

# Git Release & Production Deployment Workflow

This skill outlines the strict procedure for version releases, multi-branch Git synchronization, and production deployments for Openlysts.

## 1. Golden Rule: "Deploy to Production"
> [!IMPORTANT]
> **When the user (CEO/CTO) says "deploy to production", that ALWAYS means:**
> 1. **Commit all changes cleanly** on the active branch (`experimental`).
> 2. **Sync and push to Git across ALL 4 branches** (`experimental`, `dev`, `main`, `backup`).
> 3. **Trigger a forced production deployment on Vercel** (`npx vercel --prod --yes --force`).
> 4. **Keep `experimental` as the active working branch** at the end of the operation.

---

## 2. Branch Architecture

Openlysts maintains a 4-branch structure:
1. **`experimental`**: The primary active working branch where current development and experiments take place.
2. **`dev`**: The unified staging branch.
3. **`main`**: The latest stable production branch.
4. **`backup`**: The disaster recovery / rollback branch.

---

## 3. Standard Execution Protocol: "Deploy to Production"

Whenever instructed to "deploy to production", execute this sequential workflow:

### Step 1: Pre-Deployment Build Check
Verify local build passes with 0 errors before initiating release:
```bash
npm run build
```

### Step 2: Commit on Active Branch
```bash
git add .
git commit -m "feat/fix: <clear summary of changes>"
git push origin experimental
```

### Step 3: Fast-Forward Sync & Push All Branches
```bash
# Sync dev
git checkout dev
git merge experimental --ff-only || git merge experimental -m "Merge experimental into dev"
git push origin dev

# Sync main
git checkout main
git merge dev --ff-only || git merge dev -m "Merge dev into main"
git push origin main

# Sync backup
git checkout backup
git merge main --ff-only || git merge main -m "Merge main into backup"
git push origin backup

# Return to active working branch
git checkout experimental
```

### Step 4: Force Deployment to Vercel Production
Deploy the build directly to Vercel production to bypass cache or paused pipelines:
```bash
npx vercel --prod --yes --force
```

### Step 5: Post-Deployment Verification
- Verify the live production deployment URL (`https://openlysts.vercel.app`).
- Confirm active working branch is `experimental` via `git branch --show-current`.

---

## 4. Releasing a Tagged Version (dev -> main with Git Tag)
When the user specifically asks for a version release tag (e.g., `v1.2.0`):
```bash
git checkout main
git tag v1.X.X
git push origin v1.X.X
git checkout experimental
```
