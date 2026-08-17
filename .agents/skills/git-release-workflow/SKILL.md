---
name: git-release-workflow
description: "SOP for merging development into main and creating semantic version backups (tags) for Openlyst."
---

# Git Release Workflow

This skill outlines the strict procedure for merging active work on `development` into the stable `main` backup branch. This should ONLY be executed when the user explicitly requests to "merge and backup" or "create a release."

## Procedure

1. **Verify State**: Ensure all current changes are committed to the `development` branch and the local directory is clean.
2. **Switch to Main**: 
   ```bash
   git checkout main
   ```
3. **Merge**:
   ```bash
   git merge development
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
6. **Return to Sandbox**: Immediately switch the user back to the active development branch to prevent accidental commits to `main`.
   ```bash
   git checkout development
   ```

> [!WARNING]
> Do NOT execute this workflow unprompted. The `main` branch is treated as an immutable backup. All standard AI work must be done on the `development` branch.
