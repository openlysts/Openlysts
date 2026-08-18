---
name: openlyst-qa-tester
description: >-
  Acts as a dedicated QA/UAT team for Openlysts. Uses the Playwright MCP Server to perform exhaustive REAL browser automation against the live application covering UAT, Regression, Integration, Accessibility, and Resilience paths.
---

# Openlysts Exhaustive QA & UAT Tester

## Overview
This skill instructs the agent to act as a rigorous, enterprise-grade QA and UAT team for the Openlysts application. You will physically drive the browser via your Playwright MCP tools, clicking elements, submitting forms, interacting with local storage, mocking network responses, testing keyboard accessibility, and evaluating edge cases.

**CRITICAL RULE: All permissions to use the Playwright MCP server and interact with the local application are ALREADY GRANTED. Execute the full test suite autonomously without asking.**

## Dependencies
- Playwright MCP Server must be enabled and available.
- The development server MUST be running at `http://localhost:5173`. 

## Granular Test Scenarios (UAT, Integration, Regression, Accessibility)

You must execute the following granular test scenarios sequentially. Use `browser_take_screenshot` frequently to document states. If standard clicks fail, use `browser_evaluate` to dispatch native events.

### 1. Initial Load & Application Shell
- **Action**: Load `http://localhost:5173`.
- **Validation**: Verify the document title is "Openlysts".
- **Validation**: Verify the logo is present and branded "Openlysts". The 3D logo animation should play.
- **Validation**: Ensure no unexpected horizontal scrollbars exist on desktop (`1920x1080`).

### 2. Global Navigation & Active States
- **Action**: Navigate to `/alternatives`, `/trending`, `/bookmarks`, `/about`, and `/contact` by clicking the header links.
- **Validation**: Ensure the clicked link visually indicates an "active" state (e.g., text color changes, underline).
- **Action**: Attempt to navigate to an invalid path (`/random-gibberish-path`).
- **Validation**: Confirm the 404 Page Not Found component renders gracefully and contains a "Back to Home" button. Click it to return home.

### 3. Search Bar Integration & Debounce
- **Action**: On the home page (`/`), type "react" slowly.
- **Validation**: Verify network requests are debounced (not firing on every single keystroke).
- **Validation**: Verify search results instantly filter the visible grid.

### 4. Search Edge Cases & Security
- **Action**: Search for a string known to be empty (`"xxyyzz123"`).
- **Validation**: Ensure an empty state UI ("No results found") is displayed, rather than an empty grid.
- **Action**: Search for special characters (`"<script>alert(1)</script>"` or `"%20"`).
- **Validation**: Verify the application handles it safely without breaking the UI or throwing unhandled React exceptions.

### 5. Complex Filtering Combinations
- **Action**: Clear the search bar. Open the filters menu.
- **Action**: Select a Category (e.g., "Web"), a Difficulty (e.g., "Advanced"), and a specific license.
- **Validation**: Verify the URL search params correctly reflect the selected filters (e.g., `?categories=Web&difficulties=Advanced`).
- **Action**: Reload the page (`await page.reload()`).
- **Validation**: Verify the filters are preserved from the URL on reload.
- **Action**: Click "Clear Filters". Ensure the URL resets and the grid repopulates.

### 6. Alternatives Database E2E
- **Action**: Navigate to `/alternatives`.
- **Validation**: Confirm that tabular data representing "Paid vs Free" is rendered.
- **Validation**: Check that the table supports scrolling if there are many rows, and that columns are aligned.
- **Validation**: Click an external link inside the alternatives list (if available) and ensure it opens correctly (or has `target="_blank"`).

### 7. Repository Details (Deep Links & UI)
- **Action**: Navigate to `/` and click a repository card.
- **Validation**: Ensure the URL updates to `/repo/:owner/:name`.
- **Validation**: Verify the repository header, star count, forks, and badges load properly.
- **Validation**: Check that the README markdown is rendered correctly (headers, code blocks, lists).
- **Action**: Click the browser "Back" button.
- **Validation**: Ensure you return to the exact scroll position and filter state on the home page.

### 8. Bookmarks Lifecycle (Local Storage & State)
- **Action**: Bookmark 3 separate repositories from the grid.
- **Action**: Navigate to `/bookmarks`. Verify exactly 3 cards exist.
- **Action**: Reload the page to test `localStorage` persistence.
- **Validation**: Verify the 3 cards still exist.
- **Action**: Un-bookmark one card from the `/bookmarks` page.
- **Validation**: Ensure the card is immediately removed from the DOM.

### 9. Forms & Validation (Boundary Testing)
- **Action**: Navigate to `/contact`.
- **Action**: Click "Submit" with an empty form.
- **Validation**: Verify inline validation errors appear for required fields.
- **Action**: Enter an invalid email (`"test@com"`) and submit.
- **Validation**: Verify email formatting validation fires.
- **Action**: Fill the form perfectly and submit.
- **Validation**: Verify a success toast/notification or confirmation message appears.

### 10. Theming & CSS Variables
- **Action**: Toggle the theme using the header button to "Dark".
- **Validation**: Verify the `<html>` or `<body>` tag receives a `dark` class or data-attribute. Check that background colors change visually via a screenshot.
- **Action**: Reload the page.
- **Validation**: Ensure "Dark" theme persists across reloads via localStorage.

### 11. Mobile Responsiveness & Touch Targets
- **Action**: Resize browser to `375x812` (iPhone X).
- **Validation**: Verify the top navigation collapses into a hamburger menu.
- **Action**: Click the hamburger menu.
- **Validation**: Verify the mobile drawer/menu opens properly and links are clickable.
- **Validation**: Verify that repository cards stack in a single column instead of a multi-column grid.

### 12. Keyboard Accessibility (a11y)
- **Action**: Go to `/` and press the `Tab` key multiple times.
- **Validation**: Verify that focus indicators (outlines) are visible on interactive elements (links, inputs, buttons).
- **Action**: Focus the search bar via `Tab`, type "test", and press `Enter`.
- **Validation**: Verify the form submits or filters correctly without mouse interaction.

### 13. API Failure Resilience (Mocking)
- **Action**: Use Playwright's network interception (`browser_evaluate` or via standard routing if supported) to block or mock a 500 error on the main `/api/functions/queryRepositories` endpoint.
- **Action**: Reload the homepage.
- **Validation**: Verify the application does not crash to a blank white screen, but instead shows a graceful error boundary or "Failed to load data" message.

## Execution Workflow

1. Execute all 13 granular test scenarios sequentially.
2. If an element cannot be clicked via `browser_click`, use `browser_evaluate` as a fallback to trigger DOM events manually.
3. Record all visual discrepancies, layout shifts, or console errors.
4. **Reporting**: After completing all scenarios, compile all findings, successes, failures, and captured screenshots into a comprehensive artifact named `qa_report_exhaustive_v2.md`. DO NOT stop or ask for permission during the execution; run the entire test autonomously.
