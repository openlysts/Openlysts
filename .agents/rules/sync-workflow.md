# Sync Workflow — Worktree → Primary Project

## Overview

Freebuff creates an isolated Git worktree inside the project (`.freebuff/worktrees/<branch>/`) for all development work. This rule ensures the user always gives **explicit consent** before any worktree changes are synced to the primary project folder at `D:/Project backup/openlyst/`.

## Core Rule

**NEVER auto-sync. NEVER auto-push. Always ask via popup.**

Every substantive task completion MUST end with a sync consent popup before `end_turn`.

## Workflow — Every Task

### Step 1: Work in Worktree
All code changes, file creation, edits, and deletions happen exclusively in the Freebuff worktree. The primary project folder is read-only until explicit sync is approved.

### Step 2: Test & Verify
Before asking for sync, complete all verification:
- `npm run build` passes
- `npm run typecheck` passes (if applicable)
- `npm test` passes (if applicable)
- Manual browser verification (if UI changes)
- Edge cases and error states checked

### Step 3: Report Results
Present a summary to the user:
- **What changed** — files modified, added, deleted
- **Test results** — pass/fail with evidence
- **Risks** — any breaking changes, migration needs, or concerns
- **Lines changed** — approximate scope

### Step 4: Ask for Sync Consent (MANDATORY)
Use `ask_questions` with exactly these 3 options:

```
┌──────────────────────────────────────────────┐
│  Sync changes to main project?               │
│                                              │
│  ✅ Yes, sync now (Recommended)              │
│  ❌ No, keep in worktree only                │
│  📋 Show diff first                          │
└──────────────────────────────────────────────┘
```

**If "Yes":** Run the sync (file copy from worktree to primary). Never commit, stage, or switch branches.

**If "No":** Changes stay in worktree only. Do not ask again for the same changes.

**If "Show diff":** Display the file-by-file diff, then ask again with the same 3 options.

### Step 5: Offer Git Push (SEPARATE QUESTION)
After sync is applied (only if user said "Yes" to sync), offer a **second** `ask_questions`:

```
┌──────────────────────────────────────────────┐
│  Push to git?                                │
│                                              │
│  ✅ Yes, push to origin (Recommended)        │
│  ✅ Yes, push to backup                      │
│  ✅ Yes, push to both remotes                │
│  ❌ No, just synced locally                  │
└──────────────────────────────────────────────┘
```

This is a **separate decision** — syncing to primary ≠ pushing to git.

## Sync Mechanics

### What Gets Synced
- All files modified, added, or deleted in the worktree since divergence point
- Both tracked and untracked (non-ignored) files
- Binary files, configs, everything

### What Gets Preserved
- Independent edits in the primary project folder (e.g., `server/data/video_cache.json`)
- Git configuration (`.git/` directory)
- `node_modules/` (never sync)
- `.freebuff/` directory itself
- Any files the user manually edited in primary

### Sync Method
```bash
# For each changed file, copy from worktree to primary
cp <worktree-path> <primary-project-path>

# For deleted files, remove from primary
rm <primary-project-path>
```

### What NEVER Gets Synced Automatically
- Commits (no `git commit` without explicit permission)
- Branch switches (no `git checkout` without explicit permission)
- Git pushes (always a separate question)
- Destructive operations (resets, reverts, force pushes)
- Environment files or secrets

## Decision Record

After each sync, log what happened:

| Timestamp | Files Synced | Git Pushed | User Decision |
|-----------|-------------|------------|---------------|
| 2026-09-02 14:30 | 3 files | No | Yes sync, no push |

## Exceptions

The ONLY scenarios where sync happens without the popup:

1. **User explicitly says "sync everything"** — blanket permission for the session
2. **User says "just do it"** after seeing test results — implied consent
3. **Emergency rollback** — user explicitly requests immediate revert

In all other cases: **always ask first**.

## Relationship to git-push-workflow.md

| Step | This Rule | git-push-workflow.md |
|------|-----------|---------------------|
| 1. Work | Worktree only | — |
| 2. Verify | Build + test | Lint + typecheck + build |
| 3. Sync | Worktree → Primary | — |
| 4. Commit | — | Conventional commits |
| 5. Push | — | Origin + backup |

This rule handles steps 1-3. The git-push-workflow.md handles steps 4-5. They work together sequentially.
