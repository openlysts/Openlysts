---
name: git-release-workflow
description: "SOP for merging dev into main, tagging a release, and maintaining the backup branch."
---

# Git Release Workflow

This skill outlines the strict procedure for releasing new versions of Openlyst. Openlyst uses a 3-branch strategy (`dev`, `main`, and `backup`). This workflow should ONLY be executed when the user explicitly requests to "release a version" or "backup the app".

## Branch Architecture

1. **`dev`**: The active development branch. All day-to-day AI changes, new features, and bug fixes happen here.
2. **`main`**: The latest stable version (Production). When `dev` is ready, it merges here. Never merge directly into `main` or `backup`without asking the user.
3. **`backup`**: The most stable, "last known good" version. When `main` proves reliable, it is backed up here.

## Procedure: Releasing a New Version (dev -> main)

1. **Verify State**: Ensure all current changes are committed to the `dev` branch and the working directory is clean.
2. **Switch to Main**:

   ```bash
   git checkout main
   ```

3. **Merge**:

   ```bash
   git merge dev
   ```

4. **Tag the Release**: Ask the user what version number they want (or increment automatically if instructed, e.g. `v1.2.0`). Create the tag:

   ```bash
   git tag v1.2.0
   ```

5. **Push to Remote**: Push both the branch and the new tag to GitHub.

   ```bash
   git push origin main
   git push origin v1.2.0
   ```

6. **Return to Sandbox**: Immediately switch the user back to the active development branch to prevent accidental commits to `main` or `backup`.

   ```bash
   git checkout dev
   ```

## Procedure: Creating a Backup (main -> backup)

When the user asks to "backup" the latest stable version:

1. **Switch to Backup**:

   ```bash
   git checkout backup
   ```

2. **Merge Main**:

   ```bash
   git merge main
   ```

3. **Push to Remote**:

   ```bash
   git push origin backup
   ```

4. **Return to Sandbox**:

   ```bash
   git checkout dev
   ```

> [!WARNING]
> Do NOT execute this workflow unprompted. The `main` and `backup` branches are treated as immutable stable states. All standard AI work must be done on the `dev` branch.
