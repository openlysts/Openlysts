---
name: git-release-workflow
description: "SOP for multi-branch Git synchronization, production releases, and forced Vercel deployments."
---

# Git Release & Production Deployment Workflow

This skill outlines the strict procedure for version releases, multi-branch Git synchronization, and production deployments for Openlysts.

## 1. Golden Rule: "Deploy to Production"
> [!IMPORTANT]
> **When the user (CEO/CTO) says "deploy to production", that ALWAYS means:**
> 1. **Commit all changes cleanly** on the active working branch (`experimental`).
> 2. **Sync and push to Git across ALL 4 branches** (`experimental`, `dev`, `main`, `backup`).
> 3. **Checkout `main` branch** before triggering Vercel deployment so that Vercel exclusively links and stamps production deployments to `main`.
> 4. **Trigger a forced production deployment on Vercel** (`npx vercel --prod --yes --force` or prebuilt deploy).
> 5. **Verify the live production deployment.**
> 6. **Return to `experimental` as the active working branch** at the end of the operation.

---

## 2. Branch Architecture

Openlysts maintains a 4-branch structure:
1. **`experimental`**: The primary active working branch where current development and experiments take place.
2. **`dev`**: The unified staging branch.
3. **`main`**: The latest stable production branch. **Vercel production deployments MUST ALWAYS and EXCLUSIVELY be executed from `main`.**
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
git commit -m "feat/fix/chore: <clear summary of changes>"
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
```

### Step 4: Checkout `main` and Force Deploy to Vercel Production
> [!IMPORTANT]
> **You MUST switch to `main` branch before deploying.** This ensures the Vercel CLI tags the production deployment as originating strictly from `main`.
```bash
git checkout main
npx vercel --prod --yes --force
```

### Step 5: Post-Deployment Verification
- Verify the live production deployment URL (`https://openlysts.vercel.app`).
- Verify critical routes, database loading, and UI responsiveness.

### Step 6: Return to Working Branch
```bash
git checkout experimental
```

---

## 4. Releasing a Tagged Version (dev -> main with Git Tag)
When the user specifically asks for a version release tag (e.g., `v1.2.0`):
```bash
git checkout main
git tag v1.X.X
git push origin v1.X.X
git checkout experimental
```
