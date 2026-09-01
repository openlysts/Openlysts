---
name: manual-folder-integration
description: "Workflow for manually integrating a new UI folder into the current project without breaking offline mode or creating mocks."
---

# Manual Folder Integration Workflow

This skill outlines the standard operating procedure for integrating an externally modified UI folder (e.g., `openlyst-Latest_...`) into the current active project (`development` branch).

## Critical Rules

> [!CAUTION]
> **NEVER CREATE MOCKS.**
> You must strictly implement real-world solutions for any missing backend or API functionality. If a frontend component requires YouTube data, search data, or database interactions, you must implement the *real* logic in the backend (using libraries, scrapers, or public APIs) and connect the frontend to it. Absolutely no `setTimeout` or hardcoded dummy data is allowed in production.

## Step-by-Step Integration Guide

1. **Scan the Drop Folder**: Recursively read the provided new version folder and compare its `src/` directory to the active project's `src/` directory.
2. **Identify Deltas**: Pinpoint exactly which React components, styles, or libraries have changed or been added. Pay special attention to routing and state management changes.
3. **Resolve API Dependencies**: Identify any new backend integrations introduced in the dropped folder. Ensure there is a real backend implementation in `server/functions/` and that the frontend `src/lib/api.js` points to it correctly.
4. **Surgical Merge**: Copy over the modified files. Do not blindly overwrite the core configuration files (like `package.json` or `vite.config.js`) without verifying they don't break existing offline or backend setups.
5. **Verification Build**: Always run `npm run build` and `npm run dev` after merging to ensure there are no missing imports or compilation errors.
6. **Cleanup**: Advise the user to delete the manual drop folder once the merge is fully tested and pushed to the `development` branch.
