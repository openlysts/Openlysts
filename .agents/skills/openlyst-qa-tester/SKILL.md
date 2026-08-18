---
name: openlyst-qa-tester
description: >-
  Acts as a dedicated QA/UAT team for Openlysts. Uses the Playwright MCP Server to perform REAL browser automation (actual clicks, navigation, typing, and screenshot capture) against the live application.
---

# Openlysts QA & UAT Tester

## Overview
This skill instructs the agent on how to act as a rigorous QA and UAT team for the Openlysts application. Instead of running background headless scripts, **you will use your Playwright MCP Server tools to physically drive the browser, click elements, fill forms, and take screenshots.** 

**CRITICAL RULE: All permissions to use the Playwright MCP server and interact with the local application are ALREADY GRANTED. Do not ask the user for permission to start testing or take screenshots. Execute the full test suite autonomously.**

## Dependencies
- Playwright MCP Server must be enabled and available.
- The development server MUST be running at `http://localhost:5173`. 

## Test Scenarios & Cases (The Golden Path)

You must execute the following test scenarios to validate the health of the application. For each step, use `browser_take_screenshot` to document the results for the final QA Report.

### 1. Initialization & Sanity Check
- **Action**: Use `browser_navigate` to `http://localhost:5173`.
- **Validation**: Verify the page title, hero text, and that trending repositories populate correctly. Take a screenshot.

### 2. Search & Filtering (UAT)
- **Action**: Use `browser_fill_form` or `browser_evaluate` to type a query into the global search bar (e.g., "react" or "agent"). Submit the search.
- **Validation**: Verify that the search results render relevant repositories.
- **Action**: Click on a Difficulty badge (e.g., "INTERMEDIATE") and a Category badge (e.g., "Framework") on a repository card.
- **Validation**: Verify that the URL updates to include `?difficulties=` or `?categories=` and the UI filters appropriately.

### 3. Alternatives Ingestion System
- **Action**: Navigate to or click the "Alternatives" tab.
- **Validation**: Ensure the page renders without 404s and displays the dynamic "Paid vs Free" mappings (e.g., Airtable -> nocodb). Take a screenshot.

### 4. Bookmarking & LocalStorage
- **Action**: Click the bookmark icon on any repository card.
- **Action**: Navigate to the "Bookmarks" tab.
- **Validation**: Verify that the previously bookmarked repository appears on the Bookmarks page. 

### 5. Mobile Responsiveness
- **Action**: Use `browser_resize` to change the viewport to a mobile width (e.g., 375x812).
- **Validation**: Verify that the navigation collapses into a hamburger menu or mobile-friendly layout. Take a screenshot.
- **Action**: Reset the viewport back to desktop resolution.

### 6. Theme Toggling
- **Action**: Click the sun/moon icon in the header to toggle Dark Mode.
- **Validation**: Verify the DOM updates to reflect dark mode styling. Take a screenshot.

### 7. Branding & Static Pages
- **Action**: Navigate to the "About" page.
- **Validation**: Verify the presence of the new large animated logo and the text "About Openlysts".

## Execution Workflow

1. Start by navigating to `http://localhost:5173`. 
2. Execute the test scenarios sequentially using `browser_navigate`, `browser_click`, `browser_fill_form`, etc.
3. If an element cannot be clicked via `browser_click` due to strict mode or visibility issues, use `browser_evaluate` as a fallback to trigger the interaction via Javascript.
4. If a page fails to load, use `browser_console_messages` to diagnose the error, fix the underlying code, and re-test.
5. **Reporting**: After completing the scenarios, compile all findings, successes, failures, and captured screenshots into a comprehensive artifact named `qa_uat_report.md`. DO NOT stop or ask for permission during the execution; run the entire test autonomously.
