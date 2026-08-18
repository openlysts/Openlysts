---
name: openlyst-qa-tester
description: >-
  Acts as a dedicated QA/UAT team for Openlysts. Uses the Playwright MCP Server to perform exhaustive REAL browser automation against the live application covering UAT, Regression, and Integration paths.
---

# Openlysts Exhaustive QA & UAT Tester

## Overview
This skill instructs the agent to act as a rigorous, enterprise-grade QA and UAT team for the Openlysts application. You will physically drive the browser via your Playwright MCP tools, clicking elements, submitting forms, interacting with local storage, and evaluating edge cases.

**CRITICAL RULE: All permissions to use the Playwright MCP server and interact with the local application are ALREADY GRANTED. Execute the full test suite autonomously without asking.**

## Dependencies
- Playwright MCP Server must be enabled and available.
- The development server MUST be running at `http://localhost:5173`. 

## Exhaustive Test Scenarios (UAT, Integration, Regression)

You must execute the following 9 test scenarios sequentially. For each major state validation, use `browser_take_screenshot` to document the results.

### 1. Global Navigation & Routing (Regression)
- **Action**: Start at `http://localhost:5173`.
- **Action**: Navigate through every top-level tab (`/alternatives`, `/trending`, `/bookmarks`, `/about`, `/contact`).
- **Action**: Navigate to an invalid route (e.g., `http://localhost:5173/invalid-path`).
- **Validation**: Verify that a 404 page renders properly. Take a screenshot.

### 2. Search Integration & Edge Cases (Integration)
- **Action**: Navigate back to the homepage (`/`).
- **Action**: Type a gibberish query (e.g., "xxyyzz123") and submit.
- **Validation**: Verify the "No results found" state renders properly. Take a screenshot.
- **Action**: Type a valid query (e.g., "agent") and submit.
- **Validation**: Verify that valid repository cards populate. Take a screenshot.

### 3. Complex Filtering Combinations (Regression)
- **Action**: Ensure you are on a populated search page (from step 2).
- **Action**: Select a Category (e.g., "Framework") and a Difficulty (e.g., "Advanced").
- **Validation**: Verify the URL search parameters update to `?categories=Framework&difficulties=Advanced`. Take a screenshot.
- **Action**: Click the "Clear" or reset filters button.
- **Validation**: Ensure the original dataset is restored and URL parameters are cleared.

### 4. Alternatives Database E2E (UAT)
- **Action**: Navigate to `/alternatives`.
- **Validation**: Verify the "Paid vs Free" list renders dynamic data from the backend SQLite database (e.g., Airtable -> nocodb). Take a screenshot.

### 5. Bookmarks Persistence Lifecycle (Integration)
- **Action**: On any repository card, click the bookmark icon.
- **Action**: Navigate to `/bookmarks` and verify the repository appears.
- **Action**: Force a page reload (`await page.reload()`) and verify the bookmark persists (LocalStorage test).
- **Action**: Click the bookmark icon again (or delete icon) to un-bookmark it.
- **Validation**: Verify the `/bookmarks` list becomes empty. Take a screenshot.

### 6. Forms & Validation (UAT)
- **Action**: Navigate to `/contact`.
- **Action**: Attempt to submit the form while it is completely empty.
- **Validation**: Verify that HTML5 or UI validation errors appear (e.g., "required field"). Take a screenshot of the errors.

### 7. Theming & State (Regression)
- **Action**: Click the sun/moon icon in the header to open the theme dropdown. Select a distinct theme (e.g., "Dark" or "Dracula").
- **Action**: Reload the page.
- **Validation**: Verify the theme preference was retained after the reload. Take a screenshot.

### 8. Repository Detail Pages (Integration)
- **Action**: Navigate to `/` and click on any repository card's title to go to its details page (`/repo/:id`).
- **Validation**: Verify the detailed view, badges, and markdown rendering. Take a screenshot.

### 9. Device Responsiveness (UAT)
- **Action**: Resize the browser to Tablet size (`768x1024`). Take a screenshot.
- **Action**: Resize the browser to Mobile size (`375x812`).
- **Validation**: Verify the navigation collapses into a hamburger menu. Take a screenshot.

## Execution Workflow

1. Execute the 9 test scenarios sequentially using `browser_navigate`, `browser_click`, `browser_evaluate`, etc.
2. If an element cannot be clicked via `browser_click`, use `browser_evaluate` as a fallback.
3. **Reporting**: After completing all scenarios, compile all findings, successes, failures, and captured screenshots into a comprehensive artifact named `qa_uat_report_exhaustive.md`. DO NOT stop or ask for permission during the execution; run the entire test autonomously.
