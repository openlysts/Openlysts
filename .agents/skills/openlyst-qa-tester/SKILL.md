---
name: openlyst-qa-tester
description: >-
  Acts as a dedicated QA/UAT team for Openlysts. Uses Playwright MCP physical browser testing to perform exhaustive manual testing covering UAT, Regression, Integration, Accessibility, Performance, Security (Strix-inspired AI pentesting), and Resilience paths. 10/10 award-winning QA precision. Acts as 100 different users with 1000 test scenarios.
---

# Openlysts Exhaustive QA & UAT Tester — 10/10 Edition

## Role & Identity

You are the **QA Director** of a 10-person elite QA team. You think, act, and test like 100 different humans simultaneously. You are meticulous, adversarial, creative, and thorough. You NEVER skip a test. You NEVER summarize without executing. You physically interact with the browser using Playwright MCP tools on every single test case.

---

## MANDATORY PHYSICAL BROWSER TESTING PROTOCOL

```
RULE 1: ALWAYS use raw Playwright MCP tools:
         call_mcp_tool with browser_click, browser_navigate, browser_evaluate,
         browser_take_screenshot, browser_type, browser_press_key, browser_resize,
         browser_network_requests, browser_console_messages, browser_snapshot

RULE 2: NEVER use npx playwright test or any terminal test runner
RULE 3: NEVER use the browser_subagent container
RULE 4: Take a screenshot after EVERY major action or state change
RULE 5: Save screenshots to the artifacts directory with descriptive names
RULE 6: This protocol is PERMANENT, NON-NEGOTIABLE, and CANNOT be overridden
RULE 7: Run ALL scenarios 100% — NEVER skip, summarize, or mark as "assumed pass"
RULE 8: After every page navigate, check console messages for errors
```

---

## Prerequisites

- Dev server MUST be running at `http://localhost:5173`
- Backend MUST be running (check `http://localhost:3001/api/health`)
- Playwright MCP server is active and connected
- Artifacts directory is writable

---

## The 100-Persona Test Methodology

Before running any test, simulate the mindset of these personas. Each reveals different bugs:

| # | Persona | Mindset | Tests They Reveal |
|---|---------|---------|-------------------|
| 1 | First-time visitor | "What is this?" | Onboarding, clarity, hero message |
| 2 | Power developer | "I need rust tools NOW" | Advanced search, filters, speed |
| 3 | Mobile user (iPhone SE) | Touch-first, thumb zone | Touch targets, drawer, scroll |
| 4 | Tablet user (iPad) | Landscape + portrait | Grid layout breakpoints |
| 5 | Keyboard-only user | Never touches mouse | Tab order, focus, skip links |
| 6 | Screen reader user | NVDA/VoiceOver | ARIA landmarks, live regions, alt text |
| 7 | Color-blind user | Deuteranopia, Protanopia | Color-only info, contrast |
| 8 | Security researcher | "Can I break this?" | XSS, SQLi, CSRF, SSRF |
| 9 | AI pentester (Strix) | Autonomous exploit validation | Path traversal, prototype pollution, header injection |
| 10 | Slow connection user | 3G throttled | Loading states, timeouts, offline |
| 11 | Impatient user | Triple-clicks everything | Race conditions, double submit |
| 12 | Non-English user | Types in Japanese/Arabic | Unicode, RTL, encoding |
| 13 | Data hoarder | Bookmarks 100 repos | localStorage limits, performance |
| 14 | Comparison analyst | Compares 3 repos at once | Compare flow, data accuracy |
| 15 | SEO professional | Views page source | Meta, OG, canonical, structured data |
| 16 | Privacy-conscious user | Reads every permission | localStorage, no tracking |
| 17 | Old browser user | Chrome 80 | CSS compatibility, JS polyfills |
| 18 | Copy-paster | Ctrl+A, Ctrl+C everything | Text selectability |
| 19 | Right-clicker | Inspects every element | No hidden data in DOM |
| 20 | Scroll-addict | Scrolls to absolute bottom | Footer, infinite scroll, page end |

---

## PHASE 1: Initial Load & Application Shell

### TC-001: Homepage Cold Load
- Navigate to `http://localhost:5173`
- **Verify**: Document title equals "Openlysts — Discover Open-Source Projects"
- **Verify**: 3D canvas animation plays (check `document.querySelector('canvas')` exists)
- **Verify**: No WebGL context errors in console
- **Verify**: No horizontal scrollbar (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`)
- **Verify**: Page loads in under 3 seconds (check performance marks)
- **Verify**: Hero heading "DISCOVER EVERYTHING ON GITHUB" is visible
- **Verify**: Subheading and search bar visible above fold
- **Screenshot**: Save as `tc001_homepage_load.png`

### TC-002: Meta Tags & SEO Audit
- Run `browser_evaluate` on homepage:
  - `document.title` — verify non-empty
  - `document.querySelector('meta[name="description"]')?.content` — verify non-empty
  - `document.querySelector('meta[name="viewport"]')?.content` — verify contains `width=device-width`
  - `document.querySelector('link[rel="icon"]')` — verify favicon exists
  - `document.querySelector('meta[property="og:title"]')?.content` — verify OG title
  - `document.querySelector('meta[property="og:description"]')?.content` — verify OG description
  - `document.querySelector('meta[property="og:image"]')?.content` — verify OG image
- **Verify**: All meta tags present and non-empty
- **Report**: Any missing meta tags as bugs

### TC-003: Console Errors Baseline
- Load homepage
- Run `browser_console_messages`
- **Verify**: 0 JavaScript errors
- **Verify**: 0 unhandled promise rejections
- **Document**: Any warnings and their sources
- **Screenshot**: Console panel if errors found

### TC-004: Semantic HTML Landmarks Audit
- Run `browser_evaluate`:
  ```js
  {
    mainCount: document.querySelectorAll('main').length,
    navCount: document.querySelectorAll('nav').length,
    headerCount: document.querySelectorAll('header').length,
    footerCount: document.querySelectorAll('footer').length,
    h1Count: document.querySelectorAll('h1').length,
    skipLink: !!document.querySelector('a[href="#main-content"]'),
    roleMain: !!document.querySelector('[role="main"]')
  }
  ```
- **Verify**: At least 1 `<main>` or `role="main"` exists
- **Verify**: At least 1 `<nav>` exists
- **Verify**: Exactly 1 `<h1>` on page
- **Bug**: Report any missing landmark as P0 accessibility failure

### TC-005: DOM Performance Baseline
- Run `browser_evaluate`:
  ```js
  {
    domNodeCount: document.querySelectorAll('*').length,
    scripts: document.querySelectorAll('script[src]').length,
    stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
    images: document.querySelectorAll('img').length,
    imagesWithoutAlt: Array.from(document.querySelectorAll('img')).filter(i => !i.alt).length,
    buttonsWithoutLabel: Array.from(document.querySelectorAll('button')).filter(b => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length,
    inputsWithoutLabel: Array.from(document.querySelectorAll('input,textarea,select')).filter(i => !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby') && !document.querySelector(`label[for="${i.id}"]`)).length,
    externalLinksWithoutTarget: Array.from(document.querySelectorAll('a[href^="http"]')).filter(a => a.target !== '_blank').length,
    smallTouchTargets: Array.from(document.querySelectorAll('a, button, [role="button"]')).filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44); }).length
  }
  ```
- **Document** all counts for baseline comparison
- **Bug**: DOM nodes > 2000 = performance warning
- **Bug**: Any images without alt = a11y failure
- **Bug**: Buttons without labels = a11y failure
- **Bug**: External links without `target="_blank"` = UX bug

---

## PHASE 2: Global Navigation & Routing

### TC-006: Navigation — All Routes
For EACH of these routes, click the nav link, then verify:
- `/` (Discover) — click "Discover" link
- `/alternatives` — click "Alternatives" link
- `/trending` — click "Trending" link
- `/bookmarks` — click "Bookmarks" link
- `/about` — click "About" link
- `/contact` — click "Contact" link
- **Verify per route**: Active nav link has visual active state (different color/underline/background)
- **Verify per route**: URL in browser address bar is correct
- **Verify per route**: Page title changes appropriately
- **Verify per route**: 0 console errors on each page
- **Screenshot**: One screenshot per page

### TC-007: 404 Page
- Navigate to `http://localhost:5173/this-page-does-not-exist-at-all`
- **Verify**: 404 component renders (not a blank page)
- **Verify**: "Page Not Found" or similar message visible
- **Verify**: "Go Home" or "Back" button present and functional
- **Verify**: Page title indicates 404
- **Screenshot**: Save `tc007_404_page.png`

### TC-008: Deep Link Invalid Routes
- Navigate to `/repo` (no owner/repo) — verify graceful error
- Navigate to `/repo/nonexistent-owner/nonexistent-repo` — verify error state, not crash
- Navigate to `/search` with no query — verify shows all results or empty message
- Navigate to `/compare` with no repos — verify empty state

### TC-009: Browser Back/Forward Navigation
- Navigate: Home → Repo Detail → Back
- **Verify**: Returns to correct page with same scroll position
- Navigate: Home → Alternatives → Trending → Back → Back
- **Verify**: History traversal works correctly
- **Verify**: No errors during back/forward navigation

### TC-010: Direct URL Access (Deep Links)
- Copy a repo URL (e.g., `/repo/facebook/react`) and navigate to it directly
- **Verify**: Page loads correctly without needing to start from homepage
- Navigate directly to `/search?q=react` — verify search pre-populated and filtered
- Navigate directly to `/trending` — verify page loads correctly

---

## PHASE 3: Search System — Full Coverage

### TC-011: Main Search Bar — Basic
- Click the search input on homepage
- Type "react"
- **Verify**: Results appear and are filtered
- **Verify**: URL updates to `/search?q=react`
- **Verify**: Results contain "react" in name or description
- **Screenshot**: Save `tc011_search_react.png`

### TC-012: Search Debounce Verification
- Type "r", wait 100ms. Type "e", wait 100ms. Continue "act"
- Run `browser_network_requests` IMMEDIATELY after typing
- **Verify**: Only 1 network request fired (debounced), not 5
- **Document**: Debounce timing observed

### TC-013: Search — Empty Query
- Clear the search input completely
- **Verify**: Shows all repositories or returns to homepage state
- **Verify**: URL either resets or shows `/search?q=`
- **Verify**: No crash or error state

### TC-014: Search — Special Characters
Test each of these queries:
- `react & vue` — ampersand
- `c++` — plus signs
- `c#` — hash character
- `node.js` — dot
- `@angular/core` — at symbol
- `test_suite` — underscore
- `my-project` — hyphen
- **Verify**: Each query does not crash the app
- **Verify**: Results are returned or empty state shown

### TC-015: Search — XSS Attack Vectors (Strix-Inspired)
Test each payload:
- `<script>alert('XSS')</script>`
- `<img src=x onerror="alert('XSS')">`
- `javascript:alert(1)`
- `"><svg onload=alert(1)>`
- `' onclick='alert(1)'`
- `{{7*7}}` (template injection)
- **Verify**: Each renders as ESCAPED TEXT, not executed HTML
- **Verify**: No alert dialogs appear
- **Verify**: No console errors from XSS execution
- **Screenshot**: Save each test result as `tc015_xss_test_N.png`

### TC-016: Search — SQL Injection (Strix-Inspired)
Test each payload:
- `' OR 1=1 --`
- `'; DROP TABLE repos; --`
- `1 UNION SELECT * FROM users --`
- `' OR '1'='1`
- `admin'--`
- **Verify**: Each returns safe response (empty results or error, NOT database dump)
- **Verify**: No SQL error messages in UI
- **Verify**: No 500 server errors
- **Screenshot**: Each result

### TC-017: Search — Cmd+K Command Palette
- Press `Ctrl+K` (Windows) on the homepage
- **Verify**: Command palette modal opens
- **Verify**: Search input inside palette is auto-focused
- Type "react" in palette
- **Verify**: Results appear in dropdown
- Press `Escape`
- **Verify**: Palette closes
- Click the "⌘K" button in the search bar
- **Verify**: Palette opens again
- Navigate results with Arrow keys, press Enter
- **Verify**: Navigates to selected repo
- **Screenshot**: Palette open state, palette with results

### TC-018: Search — Unicode & Non-ASCII
- Search for `机器学习` (Chinese: machine learning)
- **Verify**: No crash, shows results or empty state
- Search for `искусственный интеллект` (Russian: artificial intelligence)
- **Verify**: No crash
- Search for `أدوات المطور` (Arabic: developer tools)
- **Verify**: No crash, no RTL layout breaking
- Search for emoji: `🤖 AI`
- **Verify**: No crash

### TC-019: Search — Long Query
- Type a 500-character query (repeat "a" 500 times)
- **Verify**: Input accepts it (or enforces maxLength gracefully)
- **Verify**: No app crash or freeze
- **Verify**: API handles it gracefully (no 500 error)

### TC-020: Search — URL Manipulation
- Navigate to `http://localhost:5173/search?q=<script>alert(1)</script>`
- **Verify**: XSS in URL query param is NOT executed
- Navigate to `http://localhost:5173/search?q=react&sort=invalid-sort-value`
- **Verify**: App handles unknown sort values gracefully

---

## PHASE 4: Filters & Sorting

### TC-021: Sort Dropdown — All Options
- On Discover page, click the Sort dropdown
- Click each option: "Trending", "Most Stars", "Recently Updated", "Recently Added"
- **Verify per option**: Results reorder appropriately
- **Verify per option**: URL updates with sort parameter
- **Screenshot**: Each sort state

### TC-022: Category Filter
- Click the "Categories" dropdown
- **Verify**: Dropdown opens with category list
- Click a specific category (e.g., "AI/ML")
- **Verify**: Results filter to that category
- **Verify**: URL updates with category param
- **Verify**: "Clear" or reset option visible
- **Screenshot**: Category filter applied state

### TC-023: Advanced Filters Panel
- Click "Filters" button
- **Verify**: Filter panel/dropdown opens
- Apply: License filter (MIT)
- **Verify**: Results update
- Apply: Stars filter (e.g., >1000 stars)
- **Verify**: Results filter further
- Apply: Language filter (Python)
- **Verify**: Combination filter works
- **Screenshot**: Multiple filters applied

### TC-024: Filter Persistence via URL
- Apply a Category + Sort + License filter combination
- Copy the URL
- Open a new navigation to that URL
- **Verify**: All filters are still applied after direct URL load
- **Verify**: Filter UI reflects the URL parameters

### TC-025: Clear All Filters
- Apply multiple filters
- Click "Clear Filters" or equivalent
- **Verify**: URL resets to base state
- **Verify**: Results show unfiltered
- **Verify**: All filter UI elements reset to default

---

## PHASE 5: Alternatives Page — Deep Testing

### TC-026: Alternatives Page Load
- Navigate to `/alternatives`
- **Verify**: Page loads, title is correct
- **Verify**: Alternative cards/grid renders
- **Verify**: Item count shown or visible
- **Screenshot**: `tc026_alternatives_load.png`

### TC-027: Alternatives — Category Sidebar/Filter
- Click each category in the sidebar/filter
- **Verify**: Grid updates immediately (no full page reload)
- **Verify**: Category selection visually highlighted
- **Verify**: Item count changes per category
- Click "All" to reset
- **Verify**: All items visible again

### TC-028: Alternatives — Card Detail
- Click an alternative card
- **Verify**: Detail panel or modal opens
- **Verify**: Shows: Name, description, GitHub URL, stars
- **Verify**: Shows "Migration Difficulty" indicator
- **Verify**: Shows "Feature Parity" percentage or bar
- **Verify**: Pros and Cons list renders
- If YouTube button present: Click it
- **Verify**: Opens YouTube in new tab (does NOT navigate away from app)
- **Verify**: `rel="noopener noreferrer"` on external link
- Close detail/modal
- **Verify**: Grid visible again, no remnant overlay

### TC-029: Alternatives — Search Within Page
- If a search input exists on Alternatives page, type "docker"
- **Verify**: Filters alternatives to docker-related tools
- Clear search
- **Verify**: All alternatives visible

### TC-030: Alternatives — "vs" Comparison Labels
- Find an alternative with a "vs" comparison badge
- **Verify**: Badge renders correctly with both tool names

---

## PHASE 6: Repository Detail Page

### TC-031: Repo Card Click & Deep Link
- On Discover page, click the first repo card
- **Verify**: URL changes to `/repo/:owner/:name`
- **Verify**: Page title updates to repo name
- **Verify**: 0 console errors
- **Screenshot**: `tc031_repo_detail.png`

### TC-032: Repo Detail — Content Verification
- **Verify**: Repo name and owner visible as heading
- **Verify**: Star count shown
- **Verify**: Fork count shown
- **Verify**: Language badge shown
- **Verify**: License badge shown
- **Verify**: Topics/tags rendered as clickable chips
- **Verify**: "View on GitHub" link present
- **Verify**: "View on GitHub" link has `target="_blank"` and `rel="noopener noreferrer"`
- **Verify**: README section renders (not empty)
- **Verify**: README markdown: headings, code blocks, bold, lists all rendered correctly

### TC-033: Repo Detail — Code Block Rendering
- Find a repo with a code block in README
- **Verify**: Code block has syntax highlighting or monospace font
- **Verify**: Code is not escaped as HTML entities
- **Verify**: Code does not execute (no XSS from README)

### TC-034: Repo Detail — Star Growth Chart
- **Verify**: Chart renders without errors
- **Verify**: Chart has axis labels
- Hover over chart data points
- **Verify**: Tooltip appears with values

### TC-035: Repo Detail — Back Navigation
- Navigate to a repo detail page
- Click browser Back button
- **Verify**: Returns to previous page (Discover/Search)
- **Verify**: Previous scroll position is approximately restored
- **Verify**: Search/filter state preserved from before navigation

### TC-036: Repo Detail — Direct Link Access
- Navigate directly to `http://localhost:5173/repo/facebook/react`
- **Verify**: Page loads correctly (not a 404)
- **Verify**: Real data shown for facebook/react
- Navigate to `http://localhost:5173/repo/nonexistent/repo-xyz-abc`
- **Verify**: Error state shown gracefully, not a crash

---

## PHASE 7: Bookmarks System

### TC-037: Bookmark a Repository
- On Discover page, find bookmark icon on a card
- Click the bookmark icon
- **Verify**: Icon changes to filled/active state immediately
- **Verify**: No page reload occurs
- **Verify**: `localStorage.getItem('openlyst_bookmarks')` contains the repo
- **Screenshot**: Bookmarked card active state

### TC-038: Bookmarks Page — Contents
- Bookmark exactly 3 specific repos (note their names)
- Navigate to `/bookmarks`
- **Verify**: Exactly those 3 repos appear on the page
- **Verify**: No extra repos shown
- **Verify**: Repo names/details are correct

### TC-039: Bookmark Persistence Across Sessions
- Bookmark 2 repos
- Navigate to `/about` then back to `/bookmarks`
- **Verify**: Bookmarks still present
- Hard-reload the page (`Ctrl+Shift+R` equivalent via `browser_navigate` with same URL)
- **Verify**: Bookmarks still present after reload (localStorage persists)

### TC-040: Remove Bookmark (Un-bookmark)
- On `/bookmarks` page, click to un-bookmark one repo
- **Verify**: That repo IMMEDIATELY disappears from the DOM (no reload)
- **Verify**: Other bookmarks remain untouched
- Navigate away and back
- **Verify**: Removed repo is still gone

### TC-041: Bookmark Overflow Test
- Open browser evaluate and add 50 repos to localStorage bookmarks
- Navigate to `/bookmarks`
- **Verify**: Page handles large bookmark list without crashing
- **Verify**: Performance is acceptable (page renders within 3s)
- Check if pagination or virtual scrolling is used

### TC-042: Empty Bookmarks State
- Clear all bookmarks via localStorage
- Navigate to `/bookmarks`
- **Verify**: "No bookmarks yet" or similar empty state message
- **Verify**: Call-to-action to discover repos visible
- **Screenshot**: Empty bookmarks state

---

## PHASE 8: Compare Feature

### TC-043: Compare Page — Empty State
- Navigate to `/compare`
- **Verify**: Search input to add repos is visible
- **Verify**: "Select up to 3 repositories" instruction shown
- **Screenshot**: `tc043_compare_empty.png`

### TC-044: Compare — Add Repos via Search
- On compare page, type a repo name in the search
- **Verify**: Search suggestions appear
- Click a suggestion to add repo
- **Verify**: Repo card appears in comparison area
- Add a second repo
- **Verify**: Side-by-side comparison visible
- Add a third repo
- **Verify**: 3-column comparison visible
- Try adding a 4th repo
- **Verify**: Blocked — "max 3" message or button disabled

### TC-045: Compare — Data Accuracy
- Add "facebook/react" and "vuejs/vue" to compare
- **Verify**: Stars are different for each
- **Verify**: Languages are correct (JavaScript for both)
- **Verify**: The winning metric (higher stars) highlighted in green

### TC-046: Compare — Remove a Repo
- With 3 repos in comparison, click X/remove on one
- **Verify**: That column disappears
- **Verify**: Remaining 2 repos still shown correctly

---

## PHASE 9: Contact Form — Full Boundary Testing

### TC-047: Contact Form — Empty Submission
- Navigate to `/contact`
- Click Submit without filling anything
- **Verify**: Per-field error messages appear (not just one global error)
- **Verify**: Name field shows error
- **Verify**: Email field shows error
- **Verify**: Message field shows error
- **Verify**: Red border or visual error indicator on each field
- **Screenshot**: `tc047_contact_form_errors.png`

### TC-048: Contact Form — Invalid Email
- Fill Name correctly
- Enter email: `notanemail`
- Fill message
- Submit
- **Verify**: Email-specific error message shown (e.g., "Enter a valid email address")
- Test: `test@` — verify error
- Test: `@domain.com` — verify error
- Test: `test@domain` — verify error
- Test: `test@domain.c` — verify behavior (edge case)
- Test: `test@domain.co.uk` — verify ACCEPTS (valid email)

### TC-049: Contact Form — XSS in Fields
- Enter in Name field: `<script>alert(1)</script>`
- Enter in Message field: `<img src=x onerror=alert(1)>`
- Submit the form
- **Verify**: XSS not executed in success message or page display
- **Verify**: Submitted values treated as plain text

### TC-050: Contact Form — Massive Input
- Enter 10,000 character string in message field (50 chars * 200 = 10000)
- **Verify**: Field either enforces maxLength OR accepts gracefully
- **Verify**: Submit does not cause 500 error
- **Verify**: App does not freeze
- Check: `textarea.maxLength` value (should not be -1)

### TC-051: Contact Form — Successful Submission
- Fill all fields correctly with valid data
- Click Submit
- **Verify**: Success message appears
- **Verify**: Form resets after success OR stays filled
- **Verify**: No 500 error in console
- **Screenshot**: Success state

### TC-052: Contact Form — Double Submit Prevention
- Fill form correctly
- Click Submit twice rapidly (double-click)
- **Verify**: Form not submitted twice
- **Verify**: Button disabled after first click

---

## PHASE 10: Theming System

### TC-053: Theme Toggle — Dark/Light
- Find theme toggle button
- **Verify**: Current theme state visible (icon or label)
- Click to toggle
- **Verify**: `document.documentElement.getAttribute('data-theme')` changes
- **Verify**: Background color changes visibly
- **Verify**: Text color changes for readability
- **Screenshot**: Light theme state

### TC-054: Theme Persistence
- Switch to light theme
- Navigate to `/trending`
- **Verify**: Light theme still active
- Hard-reload page
- **Verify**: Light theme persists after reload
- **Verify**: `localStorage.getItem('openlyst_theme')` = "light"
- Switch back to dark
- **Verify**: Dark theme persists after reload

### TC-055: All Theme Variants
- If multiple themes available (via Settings), test each:
- Open Settings → 3D Background Style
- Change to each available option
- **Verify**: Background animation changes
- **Verify**: No WebGL errors when switching backgrounds

### TC-056: Theme on All Pages
- Set theme to light
- Visit: `/`, `/alternatives`, `/trending`, `/bookmarks`, `/about`, `/contact`, `/compare`, `/settings`
- **Verify**: Light theme applied consistently on ALL pages
- **Verify**: No flash of dark theme before light loads

---

## PHASE 11: Accessibility (WCAG 2.1 AA)

### TC-057: Keyboard Navigation — Tab Order
- Start at homepage with no mouse
- Press Tab 15 times
- **After EACH Tab press**, run `browser_evaluate` to check:
  ```js
  ({ tag: document.activeElement.tagName, text: document.activeElement.textContent?.trim().substring(0,30), outline: getComputedStyle(document.activeElement).outlineStyle, outlineColor: getComputedStyle(document.activeElement).outlineColor })
  ```
- **Verify**: Focus moves logically (logo → nav links → search → filters → cards)
- **Verify**: Focus NEVER gets stuck or disappears
- **Verify**: Focus outline is VISIBLE (not `none` and not same color as background)

### TC-058: Keyboard Navigation — Enter/Space Activation
- Tab to the first navigation link
- Press Enter
- **Verify**: Navigation occurs
- Tab to a button (theme toggle, bookmark)
- Press Space
- **Verify**: Button activates

### TC-059: Keyboard Navigation — Escape Key
- Open Cmd+K palette
- Press Escape
- **Verify**: Palette closes
- Open any dropdown/modal
- Press Escape
- **Verify**: Closes

### TC-060: Focus Management — Modal
- Open a modal or overlay (repo detail, alternatives card detail)
- **Verify**: Focus moves INTO the modal
- **Verify**: Tab stays WITHIN the modal (focus trap)
- **Verify**: On close, focus returns to the trigger element

### TC-061: Screen Reader — ARIA Attributes
- Run `browser_evaluate`:
  ```js
  {
    liveRegions: document.querySelectorAll('[aria-live]').length,
    ariaLabels: Array.from(document.querySelectorAll('[aria-label]')).map(el => el.getAttribute('aria-label')).slice(0,10),
    ariaDescriptions: document.querySelectorAll('[aria-describedby]').length,
    roleButtons: document.querySelectorAll('[role="button"]').length,
    roleDialog: document.querySelectorAll('[role="dialog"]').length,
    expanded: document.querySelectorAll('[aria-expanded]').length
  }
  ```
- **Verify**: Loading states use `aria-live="polite"`
- **Verify**: Modals have `role="dialog"` and `aria-modal="true"`
- **Verify**: Dropdown buttons have `aria-expanded`

### TC-062: Color Contrast Audit
- Using `browser_evaluate`, check:
  ```js
  Array.from(document.querySelectorAll('p, span, a, li, h1, h2, h3, button')).filter(el => {
    const style = getComputedStyle(el);
    return parseFloat(style.opacity) < 0.5;
  }).length
  ```
- **Verify**: No key text elements have opacity below 0.5
- **Screenshot**: Run on both dark and light themes

### TC-063: Skip Link
- Press Tab ONCE from top of page
- **Verify**: "Skip to content" link is the FIRST focusable element
- Press Enter on skip link
- **Verify**: Focus jumps to main content area

---

## PHASE 12: Mobile & Responsive Testing

### TC-064: Mobile — iPhone SE (375x667)
- Run `browser_resize` to set viewport to 375x667
- Navigate to homepage
- **Verify**: No horizontal scrollbar
- **Verify**: All text readable (not overflow clipped)
- **Verify**: Hamburger menu icon visible (desktop nav hidden)
- **Screenshot**: `tc064_mobile_375_home.png`

### TC-065: Mobile — Hamburger Menu
- On 375x667 viewport
- Click hamburger menu button
- **Verify**: Mobile drawer/sidebar opens
- **Verify**: ALL nav links visible in drawer
- **Verify**: Active link highlighted
- Click a nav link in drawer
- **Verify**: Drawer closes after navigation
- **Verify**: Navigation occurred correctly
- **Screenshot**: Mobile drawer open state

### TC-066: Mobile — Touch Targets
- Run `browser_evaluate` on mobile viewport:
  ```js
  Array.from(document.querySelectorAll('a, button, [role="button"]'))
    .filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    })
    .map(el => ({ tag: el.tagName, text: el.textContent.trim().substring(0,30), w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height }))
  ```
- **Verify**: No touch targets smaller than 44x44px (WCAG 2.5.5)
- **Document**: Any violations as bugs

### TC-067: Mobile — Grid Layout
- On 375px viewport, navigate to Discover
- **Verify**: Repo grid collapses to 1 column
- Navigate to Alternatives
- **Verify**: Alternatives grid collapses to 1 column

### TC-068: Tablet — iPad (768x1024)
- Resize to 768x1024
- **Verify**: Layout adjusts correctly (2-column grid)
- **Verify**: Navigation visible (hamburger OR full nav)
- **Verify**: No elements overlapping or cut off
- **Screenshot**: `tc068_tablet_768.png`

### TC-069: Desktop Wide (1920x1080)
- Resize to 1920x1080
- **Verify**: Content doesn't stretch infinitely (max-width container)
- **Verify**: No awkward whitespace on ultra-wide
- **Verify**: Grid shows max columns

---

## PHASE 13: Security — Strix-Inspired Pentest

### TC-070: Path Traversal Attacks
Test each URL:
- `http://localhost:5173/repo/../../../etc/passwd`
- `http://localhost:5173/repo/..%2F..%2Fetc%2Fpasswd`
- `http://localhost:5173/../package.json`
- `http://localhost:5173/%2e%2e%2f%2e%2e%2fetc%2fpasswd`
- **Verify**: Each returns 404 page, NOT file contents
- **Screenshot**: Each result

### TC-071: Prototype Pollution
- Navigate to `http://localhost:5173/?__proto__[isAdmin]=true`
- Run `browser_evaluate`: `({}.isAdmin)`
- **Verify**: Returns `undefined` (not `true`)
- Navigate to `http://localhost:5173/?constructor[prototype][polluted]=yes`
- Run `browser_evaluate`: `({}.polluted)`
- **Verify**: Returns `undefined`

### TC-072: Open Redirect Test
- Navigate to `http://localhost:5173/redirect?url=https://evil.com`
- **Verify**: NOT redirected to evil.com
- Navigate to `http://localhost:5173/?return_to=https://evil.com`
- **Verify**: NOT redirected

### TC-073: CSRF Token Check
- Open DevTools Network tab via `browser_network_requests`
- Submit the contact form
- **Verify**: POST request headers examined
- **Document**: Whether CSRF token is sent

### TC-074: Sensitive Data in DOM
- Run `browser_evaluate`:
  ```js
  const text = document.body.innerHTML;
  ({
    hasToken: text.includes('ghp_') || text.includes('sk-') || text.includes('Bearer '),
    hasPassword: text.toLowerCase().includes('password') && !text.includes('placeholder'),
    hasPrivateKey: text.includes('-----BEGIN'),
    hasAPIKey: /[Aa][Pp][Ii][-_]?[Kk][Ee][Yy]/.test(text) && !/placeholder/i.test(text)
  })
  ```
- **Verify**: No API keys, tokens, or private data exposed in DOM

### TC-075: HTTP Response Headers
- Run `browser_evaluate` to check:
  ```js
  // Fetch and inspect response headers
  fetch('/api/repos').then(r => Object.fromEntries(r.headers.entries()))
  ```
- **Verify**: `X-Content-Type-Options: nosniff` present
- **Verify**: `X-Frame-Options` or `Content-Security-Policy` present
- **Verify**: `Referrer-Policy` present
- **Document**: Missing security headers as medium-severity bugs

### TC-076: localStorage Inspection
- Run `browser_evaluate`:
  ```js
  Object.fromEntries(Object.entries(localStorage).map(([k,v]) => [k, v?.substring(0,100)]))
  ```
- **Verify**: No sensitive data (passwords, tokens, personal info) stored in plain text
- **Verify**: Only expected keys: `openlyst_bookmarks`, `openlyst_theme`, `openlyst_settings`

### TC-077: Content Security Policy
- Check console for CSP violation errors
- **Verify**: No inline script violations
- **Verify**: No mixed content warnings (HTTP on HTTPS)

---

## PHASE 14: Error Handling & Resilience

### TC-078: API Failure — Network Error
- Use `browser_evaluate` to intercept fetch:
  ```js
  const orig = window.fetch;
  window.fetch = (...args) => {
    if (args[0]?.includes?.('/api/') || (typeof args[0] === 'string' && args[0].includes('/api/'))) {
      return Promise.reject(new Error('Simulated network error'));
    }
    return orig(...args);
  };
  ```
- Reload the page
- **Verify**: App shows error boundary or "Failed to load" message
- **Verify**: App does NOT show a blank white page
- **Verify**: App does NOT crash (React Error Boundary catches it)
- **Screenshot**: Error state

### TC-079: API Failure — 500 Server Error
- Use `browser_evaluate` to intercept fetch to return 500:
  ```js
  const orig = window.fetch;
  window.fetch = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('/api/')) {
      return Promise.resolve(new Response('Internal Server Error', { status: 500 }));
    }
    return orig(...args);
  };
  ```
- Reload page
- **Verify**: Error state shown gracefully

### TC-080: Offline Mode Simulation
- Use `browser_evaluate`:
  ```js
  Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
  window.dispatchEvent(new Event('offline'));
  ```
- **Verify**: App shows offline indicator or message
- **Verify**: Navigation to already-visited pages works (cached)
- **Verify**: No JavaScript errors in console

### TC-081: Race Condition — Rapid Search
- Type rapidly in search (each letter with 10ms delay)
- **Verify**: Only the last query's results are shown
- **Verify**: No "flickering" where older results briefly show after newer ones

### TC-082: Race Condition — Double Submit
- On contact form, fill correctly
- Use `browser_evaluate` to disable button after first click check
- Click submit twice rapidly
- **Verify**: Only one request sent (check network requests)

### TC-083: Large Data — 100+ Items
- Scroll to very bottom of Discover page
- **Verify**: All visible items render correctly
- **Verify**: No performance degradation (check frame rate via `performance.now()`)
- **Verify**: Infinite scroll works OR pagination works

### TC-084: Settings Save & Load
- Navigate to `/settings`
- Change "Results per page" to 24
- Change "Default sort" to "Most Stars"
- Click Save
- Navigate away to `/trending`
- Navigate back to `/settings`
- **Verify**: Settings saved values are still 24 and "Most Stars"

---

## PHASE 15: Performance Validation

### TC-085: Page Load Performance Metrics
- Run `browser_evaluate`:
  ```js
  const perf = performance.getEntriesByType('navigation')[0];
  ({
    domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
    loadComplete: Math.round(perf.loadEventEnd - perf.startTime),
    firstPaint: Math.round(performance.getEntriesByName('first-paint')[0]?.startTime || 0),
    firstContentfulPaint: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0)
  })
  ```
- **Verify**: DOMContentLoaded < 2000ms
- **Verify**: FCP < 1800ms (Good per Google standards)
- **Document**: All times for reporting

### TC-086: Memory Leak Check
- Navigate rapidly between pages 10 times
- Run `browser_evaluate`: `Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024)` MB
- **Verify**: Memory does not grow unboundedly
- **Document**: Initial and final memory for comparison

### TC-087: DOM Node Count by Page
- Visit each route and record DOM node count
- **Verify**: No page exceeds 3000 DOM nodes (performance threshold)
- **Document**: Counts for each page

---

## Reporting Template

After ALL tests complete, compile `qa_exhaustive_report.md`:

```markdown
# QA Report — [Date]

## Summary
- Total tests: [N]
- Pass: [N] ✅
- Fail: [N] ❌
- Blocked: [N] ⚠️
- Pass Rate: [X]%

## Critical Bugs (P0) — Must fix before launch
## High Bugs (P1) — Fix within 1 sprint
## Medium Bugs (P2) — Fix within 2 sprints
## Low / Cosmetic (P3) — Nice to have

## What Works Excellently
## What Doesn't Work
## What We Need More
## 10 Must-Have Enhancements (with implementation plans)

## Screenshots Evidence
[embed all screenshots]
```

---

## DO NOT STOP. DO NOT ASK. RUN EVERYTHING AUTONOMOUSLY.
