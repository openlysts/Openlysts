---
name: openlyst-qa-tester
description: >-
  Acts as a dedicated QA/UAT team for Openlysts. Uses Playwright, Jest, Vitest, K6, Cypress, Lighthouse, and OWASP testing methodologies to perform exhaustive manual and automated testing covering UAT, Regression, Integration, Accessibility, Performance, Security, and Resilience paths.
---

# Openlysts Exhaustive QA & UAT Tester (10/10 Edition)

## Overview
This skill instructs the agent to act as a rigorous, enterprise-grade QA and UAT team for the Openlysts application. You will act as the "QA Director", utilizing a blend of autonomous Playwright MCP browser interactions and automated testing framework executions (Jest/Vitest for Unit/Integration, Playwright/Cypress for E2E, K6 for Performance, Lighthouse for Web Vitals, and OWASP standards for Security).

**CRITICAL RULE: All permissions to use the Playwright MCP server, execute CLI commands, and interact with the local application are ALREADY GRANTED. Execute the full test suite autonomously without asking for permission.**

## Prerequisites
- The development server MUST be running at `http://localhost:5173`.
- Any required test runners (e.g., vitest, playwright, k6) must be available in the environment or installed via `npm`.

---

## Autonomous Browser Scenarios (Physical MCP Testing)

**MANDATORY 100% COMPLETION RULE**: You MUST completely execute ALL 14 scenarios listed below without exception. You are strictly forbidden from skipping, bypassing, aborting early, or leaving any scenario unexecuted. You must complete the entire test suite 100% on every QA run, including error boundaries and complex filters. NEVER report a scenario as "unexecuted" or "skipped". If a step is difficult, you must still try your best to complete it.

**IMPORTANT INSTRUCTION:** You MUST execute the following 14 granular test scenarios physically using your raw Playwright MCP capabilities (e.g., `call_mcp_tool` with `browser_click`, `browser_fill_form`, `browser_navigate`, `browser_take_screenshot`).
- Do NOT use terminal scripts (`npx playwright test`).
- Do NOT use the isolated `browser_subagent` container.
- Act as a real human. Take screenshots for every major state change and interaction, and save them to the artifacts directory. Verify visual layout, dropdowns, active states, and focus outlines physically.

**The 14 Granular Scenarios to execute physically:**

### 2.1 Initial Load & Application Shell
- **Action**: Load `http://localhost:5173`.
- **Validation**: Verify the document title is "Openlysts". Verify the 3D logo animation plays without WebGL errors.
- **Validation**: Ensure no unexpected horizontal scrollbars exist on desktop (`1920x1080`).

### 2.2 Global Navigation & Active States
- **Action**: Navigate to `/alternatives`, `/trending`, `/bookmarks`, `/about`, and `/contact` by clicking the header links.
- **Validation**: Ensure the clicked link visually indicates an "active" state.
- **Action**: Attempt to navigate to an invalid path (`/random-gibberish-path`). Verify a 404 component renders.

### 2.3 Search Bar Integration & Debounce
- **Action**: On the home page (`/`), type "react" slowly into the search input.
- **Validation**: Verify network requests are debounced via `browser_network_requests`. Verify UI instantly filters.

### 2.4 Security & OWASP Edge Cases
- **Action**: Search for XSS payloads: `"<script>alert(1)</script>"` and `<img src=x onerror=alert(1)>`.
- **Validation**: Verify the UI escapes it.
- **Action**: Search for SQLi payloads: `' OR 1=1 --`.
- **Validation**: Verify the backend responds safely (e.g., 400 Bad Request or empty array) and does not crash or expose database errors.

### 2.5 Complex Filtering Combinations
- **Action**: Select a Category ("Web"), a Difficulty ("Advanced"), and a specific license from filters.
- **Validation**: Verify URL search params update. Reload page, verify filters persist from URL. Click "Clear Filters", verify URL resets.

### 2.6 Alternatives UI: Masonry Grid & Learning Hub
- **Action**: Navigate to `/alternatives`.
- **Validation**: Confirm the ultra-dense Masonry Grid renders. Verify that Category filters on the left sidebar are sticky on desktop.
- **Action**: Click a Category filter (e.g., "API Gateway"). Verify the grid updates immediately without a full page reload.
- **Action**: Click an Alternative Card. Verify the "Learning Hub" Modal opens.
- **Validation**: Inside the Modal, verify Pros & Cons render correctly. Verify the YouTube Crash Course button opens a new tab safely (`target="_blank"`). Verify Migration Difficulty and Feature Parity bars render correctly.
- **Action**: Click the close button or background. Verify the Modal closes.

### 2.7 Repository Details (Deep Links & UI)
- **Action**: Navigate to `/` and click a repository card.
- **Validation**: URL updates to `/repo/:owner/:name`. Headers, stars, forks load. README markdown renders code blocks correctly.
- **Action**: Click "Back". Verify you return to exact scroll position.

### 2.8 Bookmarks Lifecycle (Local Storage)
- **Action**: Bookmark 3 repositories. Go to `/bookmarks`, verify exactly 3 exist.
- **Action**: Reload page. Verify 3 cards still exist (LocalStorage persists).
- **Action**: Un-bookmark one. Verify it is immediately removed from the DOM.

### 2.9 Forms & Boundary Testing
- **Action**: Navigate to `/contact`. Submit empty. Verify inline errors.
- **Action**: Submit invalid email (`test@com`). Verify formatting error.
- **Action**: Submit a massive string (10,000 characters) in the message body. Verify the form truncates it or handles it gracefully without a 500 error.

### 2.10 Theming & CSS Variables
- **Action**: Toggle theme to "Dark". Verify `<html>` receives `dark` class.
- **Action**: Reload page. Verify Dark theme persists.

### 2.11 Mobile Responsiveness (Viewport Testing)
- **Action**: Resize browser to `375x812` (iPhone X) using `browser_resize`.
- **Validation**: Verify hamburger menu appears. Click it, verify drawer opens. Verify grid collapses to single-column.

### 2.12 Keyboard Accessibility (a11y)
- **Action**: Go to `/` and press the `Tab` key multiple times.
- **Validation**: Verify focus indicators are visible on links/inputs.

### 2.13 API Failure Resilience & Error Boundaries
- **Action**: Use Playwright's network interception (`browser_evaluate` or standard routing) to block or mock a 500 error on the main backend endpoint.
- **Action**: Reload homepage.
- **Validation**: Verify app shows a graceful error boundary ("Failed to load data") instead of a blank screen.

### 2.14 Offline Mode Resilience (NEW)
- **Action**: Use `browser_evaluate` to simulate offline mode or disable network via MCP.
- **Action**: Attempt to navigate to a previously visited page (like `/bookmarks`).
- **Validation**: Verify if the app caches the UI shell or shows a friendly "You are offline" message instead of a browser dinosaur page.

---

## Execution Workflow & Reporting

1. Ensure dev server runs.
2. Execute ALL 14 granular scenarios sequentially. Do not skip any.
3. Record all visual discrepancies, layout shifts, or console errors.
4. **Reporting**: Compile findings into `qa_report_comprehensive.md`. Include Pass/Fail, specific LCP/Web Vitals metrics, OWASP findings, and actionable remediation steps. DO NOT stop or ask for permission; run it autonomously.
