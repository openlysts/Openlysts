---
name: openlyst-qa-tester
description: >-
  Acts as a dedicated QA/UAT team for Openlysts. Uses Playwright MCP physical browser testing to perform exhaustive manual testing covering UAT, Regression, Integration, Accessibility, Performance, Security (Strix-inspired AI pentesting), and Resilience paths. Award-winning QA precision. Acts as 100 different users with 1000 test scenarios.
---

# Openlysts Exhaustive QA & UAT Tester -

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
| --- | --------- | --------- | ------------------- |
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
| 21 | Site Administrator | "I manage data & pipelines" | Ingestion runs, scores, API key management |
| 22 | New Registered User | "I want an account & sync" | Signup, OAuth, session persistence |
| 23 | Malicious Actor (Bypasser) | "Let me access /admin directly" | RBAC bypass, unauthenticated API calls |
| 24 | Content Curator | "Adding new repo manually" | Repo metadata editing, categorization |
| 25 | Video Learner | "I want video tutorials for repos" | YouTube embeds, video player states |

---

## PHASE 1: Initial Load & Application Shell

### TC-001: Welcome Page Cold Load

- Navigate to `http://localhost:5173`
- **Verify**: Document title equals "Openlysts — Discover Open-Source Projects"
- **Verify**: 3D canvas animation plays (check `document.querySelector('canvas')` exists)
- **Verify**: No WebGL context errors in console
- **Verify**: No horizontal scrollbar (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`)
- **Verify**: Page loads in under 3 seconds (check performance marks)
- **Verify**: "Openlysts" particle text is visible
- **Verify**: Subheading "Explore, compare, and discover..." is visible
- **Screenshot**: Save as `tc001_welcome_load.png`

### TC-001b: Discover Page Cold Load

- Navigate to `http://localhost:5173/discover`
- **Verify**: Hero heading "DISCOVER EVERYTHING ON GITHUB." (case-insensitive) is visible
- **Verify**: Search bar is visible above fold
- **Screenshot**: Save as `tc001b_discover_load.png`

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

## PHASE 16: Authentication & Authorization Flow

### TC-088: Email/Password Sign Up — Validation & Errors

- Navigate to `http://localhost:5173/register`
- Click "Create Account" with empty fields
- **Verify**: Field-level validation errors appear for Name, Email, and Password
- Enter invalid email format `invalid-user` -> **Verify**: "Please enter a valid email address"
- Enter short password (< 6 characters) -> **Verify**: Password length warning displayed
- **Screenshot**: `tc088_register_errors.png`

### TC-089: Email/Password Sign Up — Successful Creation & Auto-Login

- Navigate to `/register`
- Fill Name: `QA Test User`, Email: `qatest_${Date.now()}@example.com`, Password: `Password123!`
- Submit registration form
- **Verify**: Success toast / notification displayed
- **Verify**: User is automatically authenticated or redirected to `/discover`
- **Verify**: Header displays user avatar / initial instead of "Log in" / "Sign up"
- **Screenshot**: `tc089_register_success.png`

### TC-090: Email/Password Sign Up — Duplicate Email Handling

- Navigate to `/register`
- Fill form using an already-registered email address
- Submit registration form
- **Verify**: User-friendly error message (e.g. "Email already in use") displayed without 500 crash
- **Verify**: Form inputs remain populated so user can correct email without retyping everything

### TC-091: Log In — Valid Credentials Flow

- Navigate to `http://localhost:5173/login`
- Enter valid credentials (Email and Password)
- Click "Log In"
- **Verify**: Loading state / spinner on button during authentication
- **Verify**: Redirection to `/discover` (or intended redirect target)
- **Verify**: Auth token / session stored in `localStorage` or `sessionStorage` / cookie
- **Screenshot**: `tc091_login_success.png`

### TC-092: Log In — Invalid Credentials & Error Banner

- Navigate to `/login`
- Enter valid email format with wrong password
- Click "Log In"
- **Verify**: Clear error banner ("Invalid email or password")
- **Verify**: Password field cleared, email field retained
- **Verify**: No uncaught exception in browser console
- **Screenshot**: `tc092_login_error.png`

### TC-093: Password Visibility Toggle & Input Attributes

- On `/login` and `/register`, type password into password field
- **Verify**: Input type is `type="password"` by default
- Click the eye / show-password icon
- **Verify**: Input type switches to `type="text"` and password is visible
- Click the eye icon again
- **Verify**: Input type switches back to `type="password"`

### TC-094: GitHub OAuth Redirection & Callback Simulation

- Navigate to `/login`
- Click "Continue with GitHub" button
- **Verify**: Initiates OAuth redirect to `/api/auth/github` or GitHub authorization URL
- Verify handling of GitHub OAuth error callbacks (e.g. user denies permission) with graceful user feedback
- **Screenshot**: `tc094_oauth_redirect.png`

### TC-095: Session Persistence Across Page Reloads & Tab Duplication

- Log in as authenticated user
- Refresh page (`F5` / `Ctrl+R`) -> **Verify**: User remains logged in (no flash of logged-out state)
- Open a second browser tab / duplicate page -> **Verify**: Authenticated session is active in new tab
- Verify user profile data loaded correctly from persistent store

### TC-096: User Logout Flow & Session Revocation

- While logged in, click user avatar / menu and click "Log Out"
- **Verify**: Session tokens / auth data cleared from storage
- **Verify**: Redirection to public view (Home / Discover)
- **Verify**: Header immediately reverts to displaying "Log in" and "Sign up" buttons
- Press browser Back button -> **Verify**: Protected views cannot be re-entered without authenticating

### TC-097: Protected Route Enforcement

- While unauthenticated (logged out / guest state):
- Navigate directly to `http://localhost:5173/profile`
- Navigate directly to `http://localhost:5173/admin`
- **Verify**: Blocked from accessing protected content
- **Verify**: Automatically redirected to `/login` with `return_to` or appropriate 403 screen

### TC-098: Unauthenticated Redirect with Return URL Handling

- While unauthenticated, navigate directly to `http://localhost:5173/profile?tab=security`
- **Verify**: Redirected to `/login?redirect=%2Fprofile%3Ftab%3Dsecurity`
- Log in successfully
- **Verify**: Automatically redirected back to original destination (`/profile?tab=security`)

### TC-099: Profile Management — Update Name, Avatar & Password

- Navigate to `/profile` as logged-in user
- Update user display name or bio -> Click "Save Changes"
- **Verify**: Instant optimistic UI update and persistence upon refresh
- Test password update form: verify old password check, new password mismatch validation

### TC-100: Session Expiry (401/403) Token Invalidation & Auto-Redirect

- Simulate expired/invalid JWT via `browser_evaluate`: corrupt token in storage
- Trigger any authenticated backend request
- **Verify**: Client catches 401 Unauthorized gracefully
- **Verify**: User notified of session expiry and redirected to login without blank screen crash

---

## PHASE 17: Admin Dashboard & Back-Office Control

### TC-101: Admin Route Guard (Non-Admin / Guest Access Denied)

- Log in as standard (non-admin) user
- Attempt navigation to `http://localhost:5173/admin`
- **Verify**: Access denied (403 Forbidden page or redirected to `/discover` with notification)
- Attempt unauthenticated guest access to `/admin` -> **Verify**: Redirected to `/login`
- **Screenshot**: `tc101_admin_guard.png`

### TC-102: Admin Dashboard Load & Analytics Overview

- Log in as authorized Admin
- Navigate to `http://localhost:5173/admin`
- **Verify**: Admin header & navigation menu visible
- **Verify**: Summary metric cards render: Total Repositories, Total Users, Ingestion Runs, API Rate Limits
- **Verify**: Real-time database metrics loaded without errors
- **Screenshot**: `tc102_admin_dashboard.png`

### TC-103: Ingestion Pipeline Control — Trigger `runIngestion` & Status Tracking

- On Admin Dashboard, locate Ingestion Control section
- Click "Run Ingestion" / "Start Discovery Pipeline"
- **Verify**: Confirmation or immediate progress indicator shown
- **Verify**: Ingestion status badge updates (e.g. `RUNNING` -> `COMPLETED`)
- **Verify**: Ingestion logs / summary display newly discovered and updated repositories
- **Screenshot**: `tc103_admin_ingestion.png`

### TC-104: Score Recalculation Engine — Trigger `recalculateScores`

- On Admin Dashboard, click "Recalculate Scores"
- **Verify**: Action dispatches `/api/scores/recalculate` without blocking UI thread
- **Verify**: Trending scores and quality rankings update in the database
- **Verify**: Success notification displayed upon completion

### TC-105: AI Auto-Classification Engine — Trigger `reclassifyRepos`

- On Admin Dashboard, locate AI Classification section
- Click "Reclassify Repositories"
- **Verify**: Triggers categorization pipeline (LLM/Gemini tags assignment)
- **Verify**: Category and tag distribution charts update accordingly

### TC-106: Repository Management — Search & Filter in Admin Panel

- Navigate to Admin Repository Management tab
- Use Admin search filter to find repos by keyword, language, or license
- **Verify**: Search executes instantly against the database
- **Verify**: Pagination controls (Next, Previous, Page size) work as expected

### TC-107: Manual Repository Addition & Validation

- Click "Add Repository" button in Admin panel
- Enter GitHub URL or `owner/repo` (e.g. `octocat/Hello-World`)
- Test invalid repository format -> **Verify**: Validation error
- Submit valid repo -> **Verify**: GitHub metadata fetched and repository added to DB
- **Screenshot**: `tc107_admin_add_repo.png`

### TC-108: Repository Edit — Modify Tags, Categories, Featured Flag

- Select a repository in Admin table and click "Edit"
- Toggle "Featured" badge, modify category tags, and edit custom notes
- Click "Save Changes"
- **Verify**: Changes persist and immediately reflect on public `/discover` and `/repo/:owner/:name` views

### TC-109: Repository Deletion with Confirmation Modal

- In Admin table, click "Delete" on a test repository
- **Verify**: Destructive action confirmation dialog opens requiring explicit confirmation
- Click "Cancel" -> **Verify**: Repo remains untouched
- Confirm deletion -> **Verify**: Repo deleted, row removed from table, 0 cascade error

### TC-110: GitHub Token & API Rate Limit Management in Admin

- Navigate to Admin Settings / System Config
- Inspect GitHub API rate limit monitor (Core, Search, GraphQL remaining calls)
- Update GitHub Personal Access Token (PAT)
- Click "Test Connection" -> **Verify**: Status indicator turns green with remaining quota count
- **Screenshot**: `tc110_admin_token_config.png`

### TC-111: User Management — Role Elevation & Demotion

- Navigate to Admin User Management table
- View user list, registered dates, authentication provider (Email / GitHub), and roles (`user`, `admin`)
- Change a user's role -> **Verify**: Role update persists in Neon DB
- Verify Admin cannot accidentally demote their own active session

### TC-112: Ingestion Run History & Audit Log Viewer

- Navigate to Ingestion History tab
- Inspect past ingestion runs table (`"IngestionRun"` table)
- **Verify**: Displays Run ID, Start Time, Duration, Status (`SUCCESS`/`FAILED`), Repos Processed, and Error Logs
- Click a run row -> **Verify**: Detailed JSON/text logs accordion expands cleanly

### TC-113: Database Connection Health Check Widget in Admin

- Inspect Database Status card in Admin Dashboard
- **Verify**: Displays Neon PostgreSQL latency (ms), active connections, and table row counts
- Simulate DB network glitch -> **Verify**: Clear visual warning ("Database degraded / reconnecting")

### TC-114: Admin Action Concurrency & Idempotency

- Rapidly double-click "Run Ingestion" or "Recalculate Scores"
- **Verify**: Prevent duplicate concurrent pipeline runs (idempotency lock / disabled button during execution)

---

## PHASE 18: Video Explanations & Multimodal Integration

### TC-115: Repo Detail Video Explanations Section

- Navigate to a repository with video explanations (e.g. `/repo/harry0703/MoneyPrinterTurbo`)
- Locate "Watch video explanations" / Video section
- Click to expand video drawer / section
- **Verify**: YouTube / Video player embeds render cleanly with thumbnail preview
- **Screenshot**: `tc115_video_section.png`

### TC-116: YouTube Embed Security & Sandbox Verification

- Inspect video `<iframe>` element in DOM
- **Verify**: `sandbox` attributes properly configured (`allow-scripts allow-same-origin allow-presentation`)
- **Verify**: No mixed content HTTP warnings on HTTPS connections
- **Verify**: Embedded player does not execute unwanted popups

### TC-117: Fallback State when No Video Found

- Navigate to a repository without video explanations
- **Verify**: Graceful empty state ("No video explanations available yet") with option to suggest or submit one
- **Verify**: Layout does not collapse or leave broken iframe placeholders

### TC-118: Settings "Auto-expand video explanations" Toggle

- Navigate to `/settings`
- Toggle "Auto-expand video explanations" setting to ON
- Navigate to a repo with video explanations -> **Verify**: Video section is auto-expanded on load
- Toggle setting to OFF -> **Verify**: Video section defaults to collapsed accordion

### TC-119: Multi-language Text Translation Widget (`translateText`)

- On repository detail page, locate language translation selector / button
- Select target language (e.g. Spanish, German, Japanese, Chinese)
- **Verify**: Repository description and overview translates accurately via API
- **Verify**: Option to "Show Original" reverts text instantly

### TC-120: Media Loading Performance & Lazy-loading

- Inspect media network waterfall during repository browsing
- **Verify**: Heavy video embeds and avatars use `loading="lazy"`
- **Verify**: Video player resources only initialize upon user interaction or visibility

---

## PHASE 19: Neon Database & Backend Pipeline Robustness

### TC-121: Live Neon Postgres Connection & Schema Verification

- Verify backend connection against live Neon database (`DATABASE_URL`)
- Verify all primary tables exist: `"Repository"`, `"User"`, `"IngestionRun"`, `"DiscoveryQuery"`
- Verify index utilization on `full_name`, `stars`, `trending_score`, `created_at`

### TC-122: Case-Sensitive Table Quote Integrity

- Inspect backend SQL queries in `server/functions/*.js` and raw Postgres handlers
- **Verify**: All table names are consistently quoted (`"Repository"`, `"User"`) or consistently lowercase
- **Verify**: No `42P01: relation does not exist` errors caused by unquoted identifier folding

### TC-123: Vercel Serverless Timeout Boundary Check

- Inspect long-running tasks (`runIngestion`, `recalculateScores`)
- **Verify**: Operations are batched with `Promise.all` chunks (e.g. 5-10 repos per batch)
- **Verify**: Individual function execution stays under Vercel serverless timeout limits (10s-60s)
- **Verify**: Ingestion supports incremental resume if interrupted

### TC-124: Dynamic Search & Discovery Verification (Zero Hardcoding)

- Audit Discovery feeds, alternatives listings, and search index
- **Verify**: Zero hardcoded repository lists or static mock arrays in client bundle
- **Verify**: All query parameters and category mappings load dynamically from Neon DB

### TC-125: SQL Injection Prevention in Admin / Backend Queries

- Execute backend queries with SQL meta-characters (`'`, `"`, `;`, `--`, `/* */`)
- **Verify**: Parameterized queries / ORM bindings prevent raw string concatenation
- **Verify**: 0 unhandled database syntax exceptions

### TC-126: Concurrent Read/Write Race Condition Handling

- Execute simultaneous search queries while updating bookmarks or running score recalculation
- **Verify**: Database connection pool handles concurrent transactions without deadlocks

---

## PHASE 20: PWA, Multi-Tab Sync & Offline Capabilities

### TC-127: Web App Manifest & Service Worker Validation

- Run `browser_evaluate` to inspect `<link rel="manifest">`
- **Verify**: `manifest.json` returns valid JSON with `name`, `short_name`, `icons`, `theme_color`
- **Verify**: Service worker registers without console errors

### TC-128: Offline Mode Banner & Cached Data Availability

- Simulate network disconnect (`navigator.onLine = false` / offline event)
- **Verify**: Non-intrusive offline banner appears informing user
- **Verify**: Bookmarks and recently viewed repositories remain fully readable from local cache
- Reconnect network -> **Verify**: Offline banner dismisses automatically

### TC-129: Recently Viewed Repos History (`openlyst_history`)

- Visit 4 different repository detail pages in sequence
- Navigate to Search / Discover or History section
- **Verify**: `openlyst_history` in `localStorage` contains visited repos in reverse chronological order
- **Verify**: Deduplication: visiting the same repo twice moves it to the top without duplicates
- Test "Clear History" button -> **Verify**: History resets cleanly

### TC-130: Multi-Tab State Synchronization

- Open Openlysts in Tab A and Tab B
- Add a bookmark in Tab A -> **Verify**: Tab B header bookmark counter updates automatically via `storage` event
- Toggle Dark/Light theme in Tab A -> **Verify**: Tab B reflects new theme instantly
- Log in on Tab A -> **Verify**: Tab B updates auth state

### TC-131: Security Headers & CORS Policy Inspection

- Inspect HTTP response headers on API routes (`/api/*`)
- **Verify**: `X-Content-Type-Options: nosniff` present
- **Verify**: `X-Frame-Options: SAMEORIGIN` or CSP frame-ancestors present
- **Verify**: CORS headers restricted to authorized origins

### TC-132: Heavy Data Stress Testing (1,000+ Items & Bookmarks)

- Populate `localStorage` with 1,000 repository IDs
- Navigate to `/bookmarks`
- **Verify**: Page renders smoothly using pagination or virtual list (no DOM freeze)
- **Verify**: Memory footprint remains stable (< 100MB JS Heap)

### TC-133: Deep Link Complex Query Matrix

- Test URL: `http://localhost:5173/search?q=machine+learning&languages=Python,C%2B%2B&license=MIT&sort=stars&page=1`
- **Verify**: All query filters populate in search bar, language chips, license dropdown, and sort selector
- **Verify**: Results accurately match the compound filter matrix

### TC-134: Mobile Touch Gestures & Viewport Interactions

- On mobile viewport (375x667), test swipe gestures on carousel / card sliders
- Test pinch-to-zoom prevention on input focus (meta viewport `maximum-scale=5` or proper font-size >= 16px to prevent iOS auto-zoom)
- **Verify**: Smooth scrolling with momentum (`-webkit-overflow-scrolling: touch`)

### TC-135: Final System State Cleanup & Artifact Verification

- Verify all temporary test entities / artifacts cleaned up
- Verify console logs free of memory leak warnings or detached DOM references
- Confirm all 20 QA phases verified and documented in `qa_exhaustive_report.md`

---

## Phase 21: UI Polish, Performance Acceleration & Navbar Harmony

### TC-136: Navbar Search Bar Layout & Wrapping Integrity

- Inspect search trigger button on desktop and tablet viewports (1024px, 1280px, 1920px)
- **Verify**: Search placeholder text ("Search openlysts...") remains on a single line with `whitespace-nowrap`
- **Verify**: Shortcut badge (`⌘K`) is properly aligned on the right without text clipping or squishing
- **Verify**: Clicking search trigger opens Command Palette instantly

### TC-137: Brand Logo Seamless Theme Blending

- Inspect brand logo in Navbar across both Dark and Light themes
- **Verify**: No harsh solid white opaque bounding box around logo in dark mode
- **Verify**: Logo blends seamlessly into the navbar background with subtle glass-morphic framing
- **Verify**: Hover effect / subtle scale animation works smoothly

### TC-138: Discover Page Sort & Filter Routing

- On `/discover` (Home), change the Sort dropdown to "Most Stars"
- **Verify**: Action immediately routes to `/search?sort=stars` or updates results
- Test "Recently Updated" and "Recently Added"
- **Verify**: Sort parameter is preserved in URL and queries reflect the chosen ordering

### TC-139: Backend In-Memory Query Cache & Response Acceleration

- Benchmark `/api/functions/queryRepositories` response time
- **Verify**: Cached repository dataset delivers response times < 25ms (sub-50ms)
- **Verify**: Pagination, filters, and full-text searches remain responsive and non-blocking

### TC-140: Discover Page Exploration Density & Rich Grid

- Inspect `/discover` repository sections
- **Verify**: Extended discovery grid renders 12+ trending and high-quality repositories
- **Verify**: Category and tag chips render cleanly with zero layout shift

---

## Phase 22: High-Taste 3D Auth Experience & Alternatives Typography

### TC-141: Alternatives Page Header & Stats Typography Harmony

- Inspect `/alternatives` hero section and stats overview (Tools, Categories, Avg Score)
- **Verify**: Stats pills and header text are harmoniously aligned without overlapping or awkward line wrapping
- **Verify**: Category accordion headers render crisp counts, icons, and clean dividers

### TC-142: Alternatives Category Accordion & Card Grid Rhythm

- Expand multiple categories (e.g. "Internal tools", "CMS", "Auth & SSO")
- **Verify**: "Replaces {Tool}" subheaders render with clean dividers and typography
- **Verify**: Cards render with feature parity score, difficulty badges, and GitHub stars

### TC-143: Creative 3D Playful Login Interface

- Navigate to `/login`
- **Verify**: 3D card tilt / glassmorphism visual presentation
- **Verify**: Background particle or ambient glow accents
- **Verify**: Interactive creative buttons with tactile active states (`scale-98`)
- **Verify**: Password toggle (`Eye`/`EyeOff`) operates smoothly

### TC-144: Creative 3D Playful Register Interface

- Navigate to `/register`
- **Verify**: Visual consistency with Login 3D aesthetic
- **Verify**: Live password strength checklist with animated status badges
- **Verify**: Social OAuth buttons render with custom high-contrast glass styling

---

## Phase 23: High-Performance Sub-20ms Loading, Alternatives Metadata Enrichment & Zero-Duplicate Sync

### TC-146: Sub-20ms queryAlternatives Response Time

- Benchmark `/api/functions/queryAlternatives` response time
- **Verify**: Response time is < 25ms (instantaneous server execution via optimized SQL join & in-memory cache)
- **Verify**: Payload contains full alternative stats (`total_tools`, `total_categories`, `top_rated`) and grouped data

### TC-147: Sub-20ms queryRepositories Feed Acceleration

- Benchmark `/api/functions/queryRepositories` with `sort: 'trending'`, `recent`, and `stars`
- **Verify**: Cached repository feeds respond in < 25ms with 0 database bottleneck
- **Verify**: Response contains total, page, perPage, and verified repository arrays

### TC-148: Complete Alternative Repository Linkage (100% Non-Null Metadata)

- Query all alternatives via `/api/functions/queryAlternatives`
- **Verify**: 100% of alternatives with valid GitHub repositories resolve with linked `repo` metadata (stars > 0, verified license, real description)
- **Verify**: Zero alternative cards render with broken/empty "Unknown" repository states

### TC-149: Expanded Modern Alternatives Catalog

- Inspect modern categories in Alternatives (AI Chatbots, AI Code Assistants, Analytics, Note-taking, Databases, Storage)
- **Verify**: Top modern open-source alternatives are present (e.g. OpenWebUI, Aider, AppFlowy, PostHog, Cal.com, Dub.co, Coolify, Documenso, MinIO, Supabase)
- **Verify**: Category counts and paid-tool replacement subheaders match live tool counts

### TC-150: Client-Side Zero-Latency Tab Switching

- Navigate rapidly between `/discover`, `/alternatives`, and `/search` in browser
- **Verify**: Pages render instantly from TanStack Query memory cache (`staleTime: 5m`) without showing loading spinners or layout flash
- **Verify**: Background refetches do not disrupt scroll position or user input

### TC-151: Database Deduplication & Integrity on Repository Table

- Query `"Repository"` table for duplicate `full_name` or `github_id`
- **Verify**: Zero duplicate records exist in the database
- **Verify**: Ingestion logic performs case-insensitive upserts without creating orphaned or redundant entries

### TC-152: Rate-Limit Aware Ingestion Engine

- Trigger `/api/functions/runIngestion`
- **Verify**: Ingestion respects GitHub rate limits with exponential backoff and never throws unhandled rate-limit rejections
- **Verify**: Returns clean JSON summary with `repos_added`, `repos_updated`, and `status: 'completed'`

### TC-153: Discover Live Metrics Instant Synchronization

- Inspect Discover page 3D live metrics badge
- **Verify**: Total live repository count reflects live database count (3,000+) with zero latency
- **Verify**: Category distribution pills (AI, DevTools, Databases, Agents, Libraries, DevOps, Security) link directly to filtered searches

### TC-154: Real-time Search Auto-Debouncing and Instant Sub-50ms Filter Queries

- Perform search queries with multi-faceted filters (e.g., `categories: ['ai']`, `languages: ['Python']`, `minStars: 1000`)
- **Verify**: Filtered queries return accurate subsets in < 50ms
- **Verify**: Clear all filters resets back to global feed instantly

### TC-155: Memory & Resource Leak Audit on High-Frequency Requests

- Send 50 consecutive requests to `/api/functions/queryAlternatives` and `/api/functions/queryRepositories`
- **Verify**: Memory footprint remains stable, zero connection leak on PostgreSQL pool
- **Verify**: Server CPU and RAM stay optimal with 0 dropped connections

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

## Reporting Template

After `qa_exhaustive_report.md` is created:

Delete all the screenshots files with .png extention from the folder.
Save the "qa_exhaustive_report.md" file.
Close the browser.
Exit the script.

---

## DO NOT STOP. DO NOT ASK. RUN EVERYTHING AUTONOMOUSLY

---

## Phase 24: Category Navigation Integrity, Slug-Label Mapping & Dynamic Metrics

> These tests were added after a P0 bug where clicking category chips on the Home page
> navigated to `/search?categories=<slug>` but the backend `slugToLabel()` could not
> resolve the slug, resulting in zero results despite the UI showing non-zero counts.

### TC-156: Category Chip → Search Route End-to-End (ALL Chips)

- On the Home page (`/`), identify ALL category chips inside DiscoverLiveMetrics
- For EACH chip, perform the following:
  1. Note the displayed count (e.g. "AI & LLMs: 142")
  2. Click the chip
  3. **Verify**: URL changes to `/search?categories=<expected-slug>`
  4. **Verify**: Search page loads with results (NOT "No matches found")
  5. **Verify**: Result count is > 0 and approximately matches the chip count
  6. **Verify**: 0 console errors
  7. Navigate back to Home and repeat for the next chip
- **CRITICAL**: This test MUST cover ALL chips including Cloud & DevOps and Security & Auth
- **Screenshot**: Any chip that produces zero results

### TC-157: Backend `slugToLabel()` Mapping Coverage

- Run `browser_evaluate` or inspect backend code:

  ```
  For each slug used in frontend navigation:
  ['ai', 'developer-tools', 'databases', 'ai-agents', 'libraries-frameworks', 'cloud-devops', 'security-auth']
  ```

- **Verify**: Every slug used in frontend `navigate()` calls has a corresponding entry in `server/shared/openlyst.js` CATEGORIES array
- **Verify**: `slugToLabel(slug)` returns a valid label (NOT the raw slug unchanged)
- **Bug**: Any slug that falls through to the raw-slug fallback is a P0 data integrity failure

### TC-158: Backend `CATEGORY_RULES` Classification Coverage

- For each label in the canonical CATEGORIES list, verify at least one `CATEGORY_RULES` entry exists that can classify repos into that category
- **Verify**: Every label returned by `slugToLabel()` matches at least one `CATEGORY_RULES[].category` string
- **Bug**: A category label with no classification rules means repos can never be assigned to it

### TC-159: Category Count Accuracy (Frontend vs Backend)

- On Home page, capture the counts displayed on each category chip
- Query the backend API: `POST /api/functions/queryRepositories` with `categories: ['<slug>']` for each slug
- **Verify**: The returned `total` approximately matches the chip count (within ±10 due to live counter increment)
- **Bug**: A chip showing 50+ but API returning 0 is a P0 data mismatch

### TC-160: Category Chip Navigation Does Not Show "Start typing to search"

- Click any category chip on Home page
- **Verify**: The Search page shows actual repository cards, NOT the empty prompt "Start typing to search"
- **Verify**: The FilterBar shows the category as actively selected (green badge)
- This specifically tests that category-only navigation (no search text) still triggers data loading

### TC-161: Discover Live Metrics — Dynamic Counts from Backend (Zero Hardcoding)

- Inspect `DiscoverLiveMetrics.jsx` source code
- **Verify**: Category chip initial counts come from `categoryCounts` prop (backend data), NOT from hardcoded `initialCount` constants
- **Verify**: The `totalRepos` prop is sourced from `trending?.total` (backend response), NOT a hardcoded default like `3000`
- **Bug**: Any hardcoded numeric constant used as the primary data source (not as a fallback) violates Zero Hardcoding policy

### TC-162: Home Page Quick Category Buttons (Sticky Navbar Floating Pills)

- Scroll down on the Home page until the floating sticky category bar appears
- Click each button in the floating bar (AI & LLMs, Developer Tools, Databases & RAG, AI Agents, Libraries, Cloud & DevOps)
- **Verify**: Each navigates to `/search?categories=<slug>` with actual results
- **Verify**: The slug used matches a valid backend category

### TC-163: Alternatives Page — Stats Pills Dynamic Data Verification

- Navigate to `/alternatives`
- Inspect the "Tools", "Categories", and "Avg Score" stat pills in the header
- **Verify**: Values are populated from the API response (`data.stats`), not hardcoded
- **Verify**: Values increment dynamically over time (useLiveCounter integration)
- Wait 15 seconds and **Verify**: At least one stat value has increased

### TC-164: Search Page — Category Filter with Zero Results Handling

- Navigate to `/search?categories=nonexistent-category-slug`
- **Verify**: App does NOT crash
- **Verify**: Shows empty results message gracefully
- **Verify**: 0 console errors

### TC-165: Category Chip Count vs categoryCounts API Response Consistency

- On Home page, run `browser_evaluate` to capture the `categoryCounts` object from the API response
- Compare each category chip's count with the corresponding `categoryCounts[label]` value
- **Verify**: Exact match (before live counter starts incrementing)
- **Bug**: Any mismatch indicates the label key mapping is wrong

### TC-166: Slug-to-Label Round-Trip Integrity

- For every slug in the system, verify: `labelToSlug(slugToLabel(slug)) === slug`
- For every label in the system, verify: `slugToLabel(labelToSlug(label)) === label`
- **Bug**: Any round-trip failure indicates a broken bidirectional mapping

### TC-167: CATEGORY_RULES Keywords Actually Match Real Repos

- For each `CATEGORY_RULES` entry, verify that at least 1 repo in the database matches the keywords/topics
- This can be verified by querying each category slug and checking `total > 0`
- **Bug**: A category rule that matches zero repos is dead code and misleading to users

### TC-168: Home Page → Category Chip → Back Navigation State Preservation

- On Home page, note scroll position and visible content
- Click a category chip (e.g. "AI & LLMs")
- Wait for Search page to load with results
- Press browser Back button
- **Verify**: Returns to Home page
- **Verify**: DiscoverLiveMetrics section is visible and chips still show counts
- **Verify**: No flash of loading state or blank content

### TC-169: Category Chips — Mobile Responsiveness (375px)

- Resize viewport to 375x667
- Navigate to Home page
- **Verify**: Category chip grid collapses to 2 columns (not overflowing)
- **Verify**: Chip text is not truncated beyond recognition
- **Verify**: All chips are tappable (touch target ≥ 44x44px effective area)
- Click a chip on mobile
- **Verify**: Navigation works correctly on mobile viewport

### TC-170: Dynamic Metric Increment Does Not Inflate Beyond Reason

- On Home page, note the initial totalRepos value
- Wait 60 seconds
- Note the new totalRepos value
- **Verify**: The increase is < 5% of the initial value (sanity check against runaway counters)
- **Bug**: If counter grows by 500+ in 60 seconds from a base of 4000, the increment rate is unrealistically fast

---

## PHASE 14: Mobile, Tablet & Multi-Device Exhaustive Test Suite (10/10 Standard)

### TC-171: Ultra-Compact Mobile Viewport (320px–360px) Zero Overflow Check

- Set viewport size to 320x568 (iPhone 5/SE1) and 360x740 (Android Galaxy A)
- Navigate through `/discover`, `/alternatives`, `/search`, `/compare`, `/repo/:owner/:name`
- Run `browser_evaluate`: `document.documentElement.scrollWidth <= document.documentElement.clientWidth`
- **Verify**: Result is strictly `true` on every single page (zero horizontal scrollbar or clipped elements).

### TC-172: Standard Mobile Viewport (375px–390px) Complete Layout Audit

- Set viewport size to 375x667 (iPhone SE/6/7/8) and 390x844 (iPhone 12/13/14)
- **Verify**: Header displays logo icon (without text crowding), search trigger, theme toggle, and hamburger menu.
- **Verify**: BottomNav displays fixed at base with 5 thumb navigation items (Discover, Alternatives, Search, Trending, Saved).
- **Verify**: Content main element has `pb-16` to prevent bottom nav occlusion.

### TC-173: Phablet / Large Mobile Viewport (412px–430px) Screen Space Utilization

- Set viewport size to 412x915 (Google Pixel 7) and 430x932 (iPhone 14/15 Pro Max)
- **Verify**: DiscoverLiveMetrics category chips render balanced in 2-column or 4-column layout without awkward orphan chips.
- **Verify**: Repository cards occupy 100% width with appropriate padding (16px margins).

### TC-174: Foldable Outer & Inner Display Transition (280px to 768px)

- Resize viewport dynamically from 280px (Galaxy Z Fold outer cover screen) to 768px (unfolded interior tablet screen)
- **Verify**: No crash, no UI clipping, and responsive breakpoints adapt cleanly without requiring page reload.

### TC-175: Tablet Portrait Viewport (768px $\times$ 1024px) Header & Grid Integrity

- Set viewport size to 768x1024 (iPad Air / iPad Mini portrait)
- **Verify**: Header renders logo, search icon, warp icon, bookmarks counter badge, settings, theme toggle, auth buttons, and drawer menu without horizontal overflow.
- **Verify**: Repository grids render in a clean 2-column layout with consistent card heights and alignment.

### TC-176: Tablet Landscape Viewport (1024px $\times$ 768px) Breakpoint Shift

- Set viewport size to 1024x768 (iPad landscape)
- **Verify**: Header does NOT crowd navigation items; uses clean tablet header layout with 0 horizontal overflow (`scrollWidth <= clientWidth`).
- **Verify**: Alternatives page category chips rail / drawer provide quick category switching.

### TC-177: Large Tablet Pro (1112px–1366px) Layout & Touch Target Check

- Set viewport size to 1112x834 and 1366x1024 (iPad Pro 12.9)
- **Verify**: Layout fluidly transitions into full desktop navigation at $\ge 1280\text{px}$.
- **Verify**: Touch gestures and mouse hovers both operate simultaneously without conflicts.

### TC-178: Touchscreen Laptop Dual-Input (Mouse + Touch Screen) Desktop Mode Verification

- On standard desktop viewports (1440x900, 1920x1080) with touch capability reported (`navigator.maxTouchPoints > 0`):
- **Verify**: Full 3D WebGL background (particles, waves, topography, etc.) is vibrant and fully rendered with high particle density.
- **Verify**: Mouse cursor moves camera in 3D parallax depth smoothly.
- **Verify**: Interactive mouse glow aura follows the cursor across the screen.
- **Verify**: Card hover elevations (`translateY(-6px)` and glowing shadow) operate flawlessly on mouse hover.

### TC-179: WCAG 2.5.5 Tap Target Size Verification (≥ 44px $\times$ 44px on all interactive elements)

- On mobile viewport (390x844), inspect all interactive buttons and links:
  - Header search trigger button (`min-width: 44px, min-height: 44px`)
  - Header hamburger button (`min-width: 44px, min-height: 44px`)
  - BottomNav 5 navigation links (`min-width: 44px, min-height: 44px`)
  - Alternative card compare checkbox (`min-width: 44px, min-height: 44px`)
  - Repo card bookmark and compare buttons (`min-width: 44px, min-height: 44px`)
  - Floating scroll-to-top button (`min-width: 44px, min-height: 44px`)
- **Verify**: Every interactive element satisfies the 44px minimum target bounding box.

### TC-180: Touch Action Delay Elimination (Instant Response, Zero 300ms Delay)

- Inspect computed CSS on buttons, links, inputs, and cards:
- **Verify**: `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` are present.
- **Verify**: Tap actions execute instantaneously without mobile double-tap zoom hesitation.

### TC-181: Momentum Touch Scrolling with Inertia (`-webkit-overflow-scrolling: touch`)

- On scrollable containers (`overflow-x-auto`, `overflow-y-auto`, modals, drawers, and category rails):
- **Verify**: `-webkit-overflow-scrolling: touch` and `scroll-behavior: smooth` are applied.
- **Verify**: Flick gestures glide smoothly with realistic deceleration.

### TC-182: Mobile Bottom Navigation (`BottomNav.jsx`) Fixed Docking & Active Tab Sync

- On mobile viewport (390x844):
- Navigate to `/discover`: **Verify** "Discover" tab highlighted with active pill indicator.
- Navigate to `/alternatives`: **Verify** "Alternatives" tab highlighted with active indicator.
- Navigate to `/search`: **Verify** "Search" tab highlighted with active indicator.
- Navigate to `/trending`: **Verify** "Trending" tab highlighted with active indicator.
- Navigate to `/bookmarks`: **Verify** "Saved" tab highlighted with active indicator.

### TC-183: Mobile BottomNav Live Saved Bookmark Counter Badge Sync

- On mobile viewport:
- Bookmark 2 repositories on `/discover`.
- **Verify**: "Saved" tab in BottomNav immediately shows red/accent badge with count `2`.
- Remove 1 bookmark: **Verify** badge immediately updates to `1`.
- Remove all bookmarks: **Verify** badge disappears cleanly.

### TC-184: Mobile Slide-Over Navigation Drawer Full-Screen Coverage via Portal

- On mobile viewport:
- Click hamburger menu button in Header.
- **Verify**: Drawer opens from right edge using `createPortal` attached directly to `document.body`.
- **Verify**: Drawer covers 100% viewport height (`h-screen` / `100vh`) regardless of header containing block.
- **Verify**: Drawer includes Logo, Openlysts title, Close button, all navigation links with bookmark badge, Settings, Welcome Screen, and Log In / Sign Up buttons.

### TC-185: Navigation Drawer Scroll Locking (`document.body.style.overflow = 'hidden'`)

- Open mobile Navigation Drawer.
- Attempt to scroll background page content behind drawer.
- **Verify**: Background body scrolling is completely locked (`overflow: hidden`).
- Close drawer: **Verify** `document.body.style.overflow` is restored immediately.

### TC-186: Navigation Drawer Backdrop Blur & Tap-Outside Dismissal

- Open mobile Navigation Drawer.
- Tap on dark backdrop overlay outside drawer content.
- **Verify**: Drawer slides closed smoothly with spring animation.

### TC-187: Navigation Drawer Keyboard ESC Key Dismissal

- Open mobile Navigation Drawer.
- Press `Escape` key.
- **Verify**: Drawer dismisses immediately.

### TC-188: Alternatives Page Full-Width Responsive Card Grid (No 230px Sidebar Squish)

- On mobile viewport (390x844) and tablet (768x1024):
- Navigate to `/alternatives`.
- **Verify**: Desktop 230px sidebar is hidden (`lg:hidden`).
- **Verify**: Alternative cards occupy **100% container width** with clear readable SaaS names, open-source replacements, score badges, and action buttons.

### TC-189: Alternatives Page Horizontal Swipeable Category Chips Rail

- On mobile `/alternatives`:
- **Verify**: Horizontal category chips rail renders below stats bar with "All Tools", "Internal tools", "Online store builder", etc.
- Swipe left/right on category rail: **Verify** rail scrolls smoothly without affecting parent page horizontal bounds.
- Tap a category chip: **Verify** active chip is highlighted with accent background and card list filters instantly.

### TC-190: Alternatives Page Slide-Up Category Sheet Drawer Modal

- On mobile `/alternatives`:
- Tap "Categories" filter button in the toolbar.
- **Verify**: Slide-up Category Sheet Drawer opens from bottom with drag handle, search/list of all 72 categories, and item counts.
- Tap any category: **Verify** sheet closes and list filters to chosen category.

### TC-191: Alternatives Detail Modal Responsive Bottom Sheet Transition on Mobile

- On mobile `/alternatives`:
- Tap on any alternative card (e.g. "Appsmith").
- **Verify**: Alternative detail modal renders as a bottom sheet modal (`max-h-[90vh] rounded-t-2xl sm:rounded-2xl`) with easy-to-tap close and external GitHub links.

### TC-192: Compare Page Sticky First Column (Row Labels) on Horizontal Scroll

- On mobile viewport (390x844):
- Navigate to `/compare?repos=facebook/react,vuejs/core,angular/angular`.
- **Verify**: ATTRIBUTES first column is sticky on the left (`sticky left-0 bg-bg-card/95 backdrop-blur-md z-20 shadow-[4px_0_12px_rgba(0,0,0,0.15)]`).
- Scroll table horizontally to the right: **Verify** row labels (Description, Stars, Forks, Issues, Language, License, etc.) remain permanently visible and aligned with repository rows.

### TC-193: Compare Table Horizontal Scroll Swipe with 2, 3, and 4 Repositories

- Test horizontal swipe physics with 2, 3, and 4 repositories.
- **Verify**: Mobile swipe hint banner displays: "Comparing N repositories | Scroll horizontally →".
- **Verify**: Repo remove `✕` buttons have 44px tap target and remove repositories dynamically without table layout breakdown.

### TC-194: Compare Floating Dock Mobile Offset (`bottom-16 sm:bottom-6`) No Overlap with BottomNav

- On mobile viewport (390x844):
- Select 2 repositories for compare from `/discover` or `/alternatives`.
- **Verify**: CompareDock appears floating at `bottom-16`, sitting cleanly above `BottomNav` without overlapping tab icons.
- **Verify**: "Compare" action button and clear trash button are easily clickable.

### TC-195: FilterBar Categories & Filter Popovers Width Constraints on Narrow Screens (`max-w-[calc(100vw-32px)]`)

- On mobile `/discover` and `/search`:
- Tap "Categories" dropdown in FilterBar.
- **Verify**: Popover width is constrained to `max-w-[calc(100vw-32px)]` and does NOT clip beyond right screen edge.
- Tap "Filters" toggle button: **Verify** accordion expands smoothly with responsive 1-column grid for licenses, languages, and difficulty filters.

### TC-196: Virtual Keyboard Appearance & Form Input Visibility (`100dvh` Viewport Resilience)

- On mobile `/search` and `/login`:
- Focus text inputs to simulate virtual keyboard trigger.
- **Verify**: Viewport height handles `100dvh` without unwanted content overflow or hidden submit buttons.

### TC-197: Search Page Sticky Input & Clear Button Touch Usability

- On mobile `/search`:
- Enter search query "react".
- **Verify**: Search input is responsive, clear button (`✕`) has 44px touch target, and "Share" / "Export JSON" action buttons fit gracefully without horizontal overflow.

### TC-200: Device Orientation Change (Portrait to Landscape) Re-flow & Geometry

- Trigger viewport resize from 390x844 (portrait) to 844x390 (landscape).
- **Verify**: Page reflows cleanly, bottom nav adapts height, and modals fit landscape viewport.

### TC-201: WebGL 3D Canvas Multi-Touch Gesture (`touchmove` Particle Interaction)

- On touch mobile/tablet:
- Perform touch drag on background canvas.
- **Verify**: `touchmove` passive event listener rotates 3D particle field smoothly in response to finger movement.

### TC-202: Mobile GPU & Battery Optimization (Particle count throttled on actual mobile devices)

- Inspect WebGL renderer on mobile screen (`< 640px`):
- **Verify**: Particle count is scaled down to ~80-120 particles for sustained 60FPS without CPU overheating or battery drain.

### TC-203: Desktop Mouse Glow Aura Dynamic Following & Radial Spotlight Visibility

- On desktop viewport (1440x900):
- Move mouse across the screen.
- **Verify**: Dynamic radial glow spotlight follows mouse cursor with smooth spring lerp interpolation (`rgba(var(--accent-rgb), 0.15)`).
- **Verify**: Mouse glow creates a rich, ambient modern glow behind cards and headings.

### TC-204: Desktop 3D WebGL Background Depth, Parallax & Particle Visibility across All Themes

- On desktop viewport (1440x900):
- Test each background type: `particles`, `waves`, `torus`, `sphere`, `rings`, `network`, `cube`, `topography`.
- Test across Dark and Light themes (`dark`, `light`, `creme`, `sand`, `mint`, `cyberpunk`, `neon`, `ocean`, `forest`, `royal`).
- **Verify**: Particles and wireframes are crisp, vibrant, and clearly visible.
- **Verify**: Mouse movement provides pronounced 3D camera parallax rotation and depth response.

### TC-205: Desktop Card 3D Tilt, Elevation & Spotlight Border Hover Interactions

- On desktop viewport (1440x900):
- Hover cursor over repository cards on `/discover`, `/search`, `/trending`.
- **Verify**: Card smoothly elevates (`translateY(-6px)`), border illuminates with accent color glow, and drop-shadow expands with ambient accent hue.
- **Verify**: Hover transitions operate at 60FPS without jitter or conflict between CSS transitions and Framer Motion.

### TC-206: Desktop Magnetic Button Hover Physics & Fluid Motion

- On desktop viewport:
- Hover over "Sign up", "Discover", and primary action buttons.
- **Verify**: MagneticButton subtly pulls toward cursor position with spring dynamics and returns to center on mouse leave.

### TC-207: Desktop Layout Toggle Simulator (`Monitor` / `Smartphone` Layout Button)

- In desktop Header (line > 1280px):
- Click the Smartphone/Monitor layout simulator toggle icon.
- **Verify**: Layout instantly constrains to mobile frame (`max-w-md`) with simulated mobile borders and shadow for quick desktop previewing of mobile UX.

### TC-208: Mobile Offline & Slow Network (3G Simulation) Touch State Handling

- Throttle network to Slow 3G on mobile viewport:
- **Verify**: Skeleton loader cards render with smooth shimmer animation and touch actions are safely disabled until data loads.

### TC-209: Mobile Double-Tap Zoom Prevention & Native Gestures Preservation

- Verify `touch-action: manipulation` prevents inadvertent double-tap zoom on buttons while allowing fluid vertical pinch/scroll gestures.

### TC-210: Full Regression Matrix: Zero Broken Features Across Desktop, Tablet, and Mobile

- Execute complete regression check across all 11 core routes (`/`, `/discover`, `/search`, `/alternatives`, `/trending`, `/compare`, `/bookmarks`, `/about`, `/contact`, `/login`, `/register`).
- **Verify**: 0 console errors, 0 runtime exceptions, 0 broken links, 0 unhandled states across all 3 device tiers (Mobile, Tablet, Desktop).

---

## PHASE 15: Admin Hypervisor & Superpower Operations Suite

### TC-211: Admin Access Authorization Guard

- Navigate to `/admin` as an unauthenticated visitor or regular user (`USER` role).
- **Verify**: User is immediately redirected to `/login?redirect=%2Fadmin` with zero access to admin APIs or state.
- **Verify**: Attempting direct API call `GET /api/admin/users` returns HTTP 401/403.

### TC-212: Admin Hypervisor 6-Pillar Navigation & State Preservation

- Sign in as an authenticated admin (`admin@localhost`).
- Navigate to `/admin`.
- **Verify**: 6-pillar command-center navigation renders:
  1. `Telemetry & Vitals`
  2. `Repository Studio & Ingest`
  3. `SaaS Alternatives`
  4. `Discovery Intelligence`
  5. `User Governance`
  6. `Security Audit`
- Switch between each tab: **Verify** active tab highlights, URL/view state updates without flickering, and data queries trigger cleanly.

### TC-213: Live GitHub Rate Limit & Database Telemetry

- On `Telemetry & Vitals` tab:
- **Verify**: GitHub API rate limit gauge renders remaining requests, total ceiling, and live reset timer.
- **Verify**: PostgreSQL database storage breakdown displays exact record counts for `"Repository"`, `"User"`, `"DiscoveryQuery"`, `"IngestionRun"`, and `"AuditLog"`.
- **Verify**: Ingestion health stats display last run status, execution duration, and success rate.

### TC-214: On-Demand Custom Repo Ingestion by URL (Single Sync)

- On `Repository Studio & Ingest` tab:
- In "Force Ingest Repo", enter `https://github.com/vllm-project/vllm` (or `vllm-project/vllm`).
- Click "Ingest Repository".
- **Verify**: Live progress spinner activates.
- **Verify**: Repo metadata (stars, description, forks, open issues) is fetched from GitHub API.
- **Verify**: OSS license is verified (Apache-2.0).
- **Verify**: Openlysts quality score and trending score are computed in real time.
- **Verify**: Repository is committed to PostgreSQL database and immediately appears in the repository table with success toast notification.

### TC-215: Batch Multi-URL Repository Ingestion

- In "Batch URL Ingestion", enter multiple GitHub URLs (one per line):

  ```
  https://github.com/ollama/ollama
  https://github.com/huggingface/transformers
  https://github.com/shadcn-ui/ui
  ```

- Click "Start Batch Ingestion".
- **Verify**: Ingestion worker processes each repository sequentially/concurrently with live per-repo progress.
- **Verify**: Success/failure summary displayed with total repos added/updated.

### TC-216: Invalid / Non-Existent Repository Ingestion Error Boundary

- In "Force Ingest Repo", enter a non-existent repo `nonexistent-user-12345/nonexistent-repo-67890`.
- Submit ingestion.
- **Verify**: UI catches HTTP 404 from GitHub gracefully.
- **Verify**: Toast notification displays clear error ("Repository not found on GitHub").
- **Verify**: No database corruption, unhandled exceptions, or blank screen crash.

### TC-217: Inline Repository Studio & Score Booster Drawer

- In Repository table, click "Edit / Boost" on any repository.
- **Verify**: Slide-out drawer opens with editable fields: Name, Description, Categories, Tags, and Openlysts Score Booster.
- Adjust score boost (+10), toggle `Staff Pick` badge, and update category.
- Save changes: **Verify** database updates immediately, table updates, and audit event `REPO_UPDATED` is recorded.

### TC-218: Repository Live Search, Category & License Multi-Filter

- In Repository table:
- Enter live search query "python".
- Filter by category "AI & LLMs" and license "verified_oss".
- **Verify**: Table updates instantaneously without full page reload.
- **Verify**: Matching count matches the filtered dataset.

### TC-219: Repository Bulk Operations (Bulk Hide, Feature, Export, Delete)

- Multi-select 3 repositories using row checkboxes.
- Click "Bulk Actions" $\rightarrow$ "Hide from Public".
- **Verify**: `hidden = true` in database for selected rows; repositories are hidden from public `/discover` feed.
- Click "Bulk Actions" $\rightarrow$ "Feature".
- **Verify**: `featured = true` for selected rows.
- Click "Export Selected" $\rightarrow$ **Verify** clean JSON/CSV export file downloads.

### TC-220: Single Repository Purge / Hard Deletion

- Click "Delete" on a test repository in the table.
- **Verify**: Confirmation modal prompts admin to confirm repository slug.
- Confirm deletion: **Verify** repository is removed from `"Repository"` table, related bookmarks/cache invalidated, and audit log `REPO_DELETED` logged.

### TC-221: SaaS Alternative Linker & Migration Parity Studio

- On `SaaS Alternatives` tab:
- Click "Map New Alternative".
- Select Open-Source Repo (e.g. `Supabase`), Proprietary SaaS (e.g. `Firebase`), Category (`Databases & Backend`), Migration Difficulty (`Medium`), and Match Score (`92%`).
- Submit: **Verify** alternative is mapped in database, immediately visible in public `/alternatives` page under the respective category and paid tool replacement group.

### TC-222: Discovery Engine GitHub Query Sandbox & Live Dry-Run

- On `Discovery Intelligence` tab:
- In "Query Sandbox", enter GitHub query syntax: `topic:rag stars:>500`.
- Click "Test Query (Dry Run)".
- **Verify**: GitHub Search API is executed without ingesting.
- **Verify**: Sandbox displays total matched repository count (e.g. `1,240 repos on GitHub`) and previews top 5 sample repositories with stars, descriptions, and license badges.

### TC-223: Discovery Query Bulk Importer & Auto-Schedule Toggle

- Paste a batch of discovery queries with category hints.
- Submit: **Verify** queries are added to `"DiscoveryQuery"` table.
- Click "Toggle Status" on any query: **Verify** `enabled` flips between `true` (Active) and `false` (Disabled) with real-time UI toggle indicator.

### TC-224: Global Operations Hub (Ingestion, Recalculate, Reclassify, Cache Flush)

- Click "Run Full Ingestion": **Verify** background worker initiates, button enters spinning state, and completion summary toast displays processed/added counts.
- Click "Recalculate Quality Scores": **Verify** scores recalculate across all repos using latest star velocity, fork ratio, and issue closure rate.
- Click "Reclassify Categories": **Verify** taxonomy classification runs across all repositories.
- Click "Flush Cache": **Verify** API and client-side query cache is purged.

---

## PHASE 16: User Governance, Security Audit & Resilience

### TC-225: User Governance List & Multi-Provider Breakdown

- On `User Governance` tab:
- **Verify**: All registered accounts render in a paginated/searchable table with Name, Email, Role, Status badge, and Auth Providers (Email, Google, GitHub).
- Search user by email: **Verify** instant table filtering.

### TC-226: User Role Promotion & Demotion (`USER` $\leftrightarrow$ `ADMIN`)

- Select a standard user and change role dropdown from `user` to `admin`.
- **Verify**: Database `role` updates to `ADMIN`, success toast appears, and audit event `USER_ROLE_CHANGED` is logged.
- Change role back to `user`: **Verify** update succeeds.

### TC-227: Final Active Admin Protection Guard

- Attempt to demote the sole remaining active admin account or change its role to `user`.
- **Verify**: Server rejects with HTTP 403 ("Cannot remove the last active admin. Promote another user first").
- **Verify**: UI displays a clear, friendly error toast and role remains `ADMIN`.

### TC-228: Instant User Suspension & Session Invalidation

- Click "Suspend User" on a target user account.
- Confirm suspension: **Verify** `account_status` updates to `SUSPENDED` in database.
- **Verify**: Target user's active session is immediately purged from `"session"` table so their next request returns 401/403.
- Attempt to log in with the suspended user's credentials: **Verify** login rejected with "Account suspended".

### TC-229: User Reactivation Cycle

- Click "Reactivate User" on a suspended account.
- **Verify**: `account_status` transitions back to `ACTIVE`.
- Log in with user credentials: **Verify** login succeeds and session is restored.

### TC-230: Superpower: One-Click Magic Password Reset Link Generator

- In User row, click "Generate Reset Link" (Key icon).
- **Verify**: Server generates a cryptographically secure 32-byte token, hashes it into `"PasswordResetToken"` table with 1-hour expiration.
- **Verify**: Modal displays the direct URL (`http://localhost:5173/reset-password?token=...`) with a "Copy to Clipboard" button.
- Click "Copy Link": **Verify** clipboard receives full URL with success feedback.
- Open link in browser: **Verify** Reset Password form loads cleanly and accepts new password.

### TC-231: Real-Time Security Audit Log Stream

- On `Security Audit` tab:
- **Verify**: Chronological list of security events renders with Actor name, Target user, Action badge (`USER_LOGIN`, `USER_REGISTERED`, `REPO_SYNCED`, `QUERY_CREATED`, `USER_SUSPENDED`), Client IP address, User Agent, and timestamp.
- Filter audit logs by action type: **Verify** table filters accurately.
- Click "Export Audit Logs" $\rightarrow$ **Verify** JSON audit export downloads.

### TC-232: Mobile & Tablet Admin Hypervisor Touch Ergonomics

- Test `/admin` across Mobile ($390\times844$) and Tablet ($768\times1024$):
- **Verify**: 6-pillar navigation converts to a horizontal touch-swipe tab rail.
- **Verify**: Large tables reflow into responsive touch-friendly cards.
- **Verify**: Drawers and modals open with smooth backdrop animation and touch-friendly close targets ($44\times44\text{px}$).
- **Verify**: DOM inspection confirms `scrollWidth <= clientWidth` (zero horizontal page scroll).

### TC-233: Theme System Aesthetic Harmony (Light & Dark Admin Auditing)

- Toggle between all 10 theme variants (`dark`, `light`, `creme`, `sand`, `mint`, `cyberpunk`, `neon`, `ocean`, `forest`, `royal`):
- **Verify**: All admin cards, telemetry meters, tables, and badge contrast ratios meet WCAG AA standards (4.5:1 min).
- **Verify**: Ambient 3D particle background remains subtle behind admin panels.

### TC-234: Network Resilience & Offline Error Boundary

- Simulate network disconnection or server 500 error during an admin mutation.
- **Verify**: UI displays contextual inline error / toast notification with retry button.
- **Verify**: Application does not crash, unmount, or leave orphaned loading spinners.

### TC-235: Self-Action Guard (Admin cannot suspend or delete self)

- Attempt to click "Suspend" or "Disable" on the currently authenticated admin's row.
- **Verify**: Action buttons are disabled with tooltip "You cannot perform this action on yourself" or server returns HTTP 403 error.

---

## PHASE 17: User Profile Studio & Customization Hub

### TC-241: Profile Authentication Guard
- Navigate to `/profile` as an unauthenticated guest.
- **Verify**: User is immediately redirected to `/login?redirect=%2Fprofile`.

### TC-242: Hero Identity Card & Display Name Live Update
- On `/profile`, update Display Name to "Lead OSS Architect" and click Save Profile.
- **Verify**: Success toast with 3D animation appears.
- **Verify**: Header user avatar and profile hero card immediately reflect the new name without requiring a hard refresh.

### TC-243: Interactive Password Strength Meter & Rules Checklist
- In Change Password section, type `short`:
- **Verify**: Strength meter shows "Weak" (red bar) and checklists (8+ chars, uppercase, number, special char) highlight failed rules.
- Type `Openlyst2026!`:
- **Verify**: Strength meter transitions to "Strong" (emerald bar) and all 4 rule checkmarks turn green.

### TC-244: Password Change Cycle & Re-Authentication
- Fill Current Password and valid New Password (`NewPass123456!`).
- Click "Update Password".
- **Verify**: Success toast appears, form fields reset cleanly.
- Log out and log in with the new password: **Verify** authentication succeeds.

### TC-245: Neon Avatar Preset Customization
- In the Avatar Picker modal / carousel, select a new avatar preset (e.g. `Cyber Explorer`, `Quantum Dev`, `Matrix Hacker`).
- Click "Apply Avatar": **Verify** avatar immediately updates across header, hero card, and user menu.

### TC-246: Connected OAuth Accounts (Google & GitHub)
- On Connected Accounts card:
- **Verify**: Connected social providers display connected date and unlink option.
- Disconnect a linked provider: **Verify** confirmation prompt appears, provider unlinks, and status updates cleanly.

### TC-247: Developer Tech Stack & Topic Tag Customization
- Select preferred language/stack tags (e.g. `React`, `Python`, `Rust`, `AI & LLMs`, `DevOps`).
- Save preferences: **Verify** tags persist in user settings and influence recommended repositories.

### TC-248: Profile Bookmarks Quick Hub & Instant Un-bookmark
- In Bookmarks section of `/profile`:
- **Verify**: Grid of bookmarked repositories renders with stars, language, and quick action buttons.
- Click un-bookmark on a repo: **Verify** 3D deletion/trash toast triggers and repository animates out smoothly.

### TC-249: 1-Click User Data Vault & Privacy Export
- Click "Download My Data (JSON)":
- **Verify**: Clean JSON file `openlysts_user_data_<timestamp>.json` downloads containing user profile details, bookmarks, and preferences.

### TC-250: Mobile & Tablet Profile Viewport Ergonomics
- Test `/profile` across Mobile ($390\times844$) and Tablet ($768\times1024$):
- **Verify**: Bento grid stacks into a clean 1-column mobile flow with zero horizontal page scroll (`scrollWidth <= clientWidth`).

---

## PHASE 18: 3D macOS Dynamic Toast Engine & Gesture Testing

### TC-256: 3D Perspective Toast Mount & Spring Entrance Physics
- Trigger any toast (e.g. bookmark repo, save profile):
- **Verify**: Toast container mounts in a 3D perspective field with spring tilt entry (`rotateX(-10deg) scale(0.92)` $\rightarrow$ `rotateX(0deg) scale(1)`).
- **Verify**: Glassmorphic frosted backdrop with dynamic ambient refraction blur (`backdrop-blur-xl`).

### TC-257: macOS-Style Trash Crumple Physics on Deletion Toasts
- Trigger a deletion action (e.g. un-bookmark repository, delete discovery query, delete user):
- **Verify**: Toast triggers with `variant: 'delete'`.
- **Verify**: Toast features a burning red/amber glass glow, trash can icon, and plays a macOS-style paper crumble / vacuum suck-away exit animation (`scale(0.3) rotate(-15deg)`).

### TC-258: Dynamic Contextual Action Types
- Test all 5 dynamic toast action styles:
  1. `success` (Emerald glow with pulsating checkmark and sparkle aura)
  2. `delete` (Crimson-amber glow with macOS trash crumple physics)
  3. `security` (Cyber-purple glow with glowing key/shield dynamic shine)
  4. `error` (Ruby red glow with gentle horizontal micro-shake on entrance)
  5. `info` (Neon sapphire pulse with animated progress spinner)
- **Verify**: Each variant displays distinct icons, glow colors, and particle borders.

### TC-259: Interactive Countdown Progress Bar & Swipe-to-Dismiss
- Trigger toast: **Verify** subtle animated progress bar at the bottom drains in sync with the auto-dismiss timer (4000ms).
- Hover over toast: **Verify** dismiss timer pauses while hovered.
- Swipe toast to the right: **Verify** gesture dismisses toast smoothly.

### TC-260: Multi-Toast Stacking & Boundary Limits
- Trigger 5 toasts in rapid succession:
- **Verify**: Toasts stack vertically with staggered 3D depth and subtle scale degradation on older toasts.
- **Verify**: Toaster does not overflow screen or overlap modal dialogs.

---

## PHASE 19: Comprehensive OAuth Lifecycle & Provider Fallback Suite

### TC-261: OAuth Route Aliases Multi-Path Routing
- Navigate to `/api/auth/google`, `/api/auth/oauth/google`, `/api/auth/github`, and `/api/auth/oauth/github`:
- **Verify**: All route variants are cleanly mapped by the backend router.
- **Verify**: No unhandled 404 "Cannot GET" errors occur on any alias path.

### TC-262: Unconfigured OAuth Environment Graceful Redirection & Notice
- In an environment where `GOOGLE_CLIENT_ID` or `GITHUB_CLIENT_ID` are missing/unconfigured:
- Click `+ Connect Google` or `+ Connect GitHub` from `/profile`:
- **Verify**: User is redirected cleanly back to `/profile?notice=oauth_not_configured&provider=<Provider>` instead of getting stranded on a raw 501 JSON page.
- **Verify**: Profile hub intercepts query parameter and displays an informative 3D info toast explaining that the OAuth provider requires client credentials.
- **Verify**: URL query parameters are cleanly stripped after toast display without leaving trailing tokens in the browser address bar.

### TC-263: OAuth State Parameter & CSRF Tampering Protection
- Initiate OAuth flow with invalid or modified `state` parameter:
- **Verify**: Backend detects state mismatch, refuses token exchange, and redirects to `/login?error=invalid_state`.
- **Verify**: Security audit log records `OAUTH_LOGIN_FAILED` with client IP and user agent.

### TC-264: OAuth User Account Auto-Linking & De-duplication
- Sign in with an OAuth account whose verified email matches an existing local password account:
- **Verify**: System links the OAuth provider ID into `"AuthAccount"` without duplicating the user in `"User"`.
- **Verify**: User is authenticated seamlessly into their existing account profile and bookmarks.

### TC-265: OAuth Disconnect & Last Authentication Method Safeguard
- User with only 1 OAuth method and no password attempts to unlink provider:
- **Verify**: System warns or requires setting a password before removing the sole authentication provider.

---

## PHASE 20: Hyper-Resilient Repository Ingestion & Scraping Fallbacks

### TC-271: On-Demand Custom Repo Ingest with GitHub API Active
- In Admin Repository Studio, enter a valid repository (e.g. `https://github.com/facebook/react`):
- Click "Ingest Repository":
- **Verify**: System fetches repo metadata, verifies license, calculates Openlysts score, and commits to `"Repository"`.
- **Verify**: Success 3D toast displays repo name and stars count, and repository table refreshes instantly.

### TC-272: Automated Web Scraping Fallback on Exhausted GitHub Rate Limits (403/429)
- Trigger on-demand sync for a repository (e.g. `https://github.com/leonxlnx/taste-skill`) when GitHub API unauthenticated 60 req/hr rate limit is exhausted:
- **Verify**: System logs `[INGEST] GitHub API rate-limited... Attempting web fallback...`.
- **Verify**: Web metadata fallback parser scrapes public repository OpenGraph tags, star counts, and license information without timing out or failing.
- **Verify**: Repository is successfully saved into PostgreSQL with accurate description, stars, and Openlysts score.
- **Verify**: Success toast displays `Successfully ingested 1 repository: leonxlnx/taste-skill`.

### TC-273: Multi-Line Batch Repository Ingestion
- In Admin Repository Studio, paste multiple repos separated by newlines:
  ```
  https://github.com/vitejs/vite
  https://github.com/tailwindlabs/tailwindcss
  shadcn/ui
  ```
- Click "Ingest Repository":
- **Verify**: System parses all formats (full URLs and `owner/name`), ingests each in sequence, and reports total ingested count in the 3D toast.

### TC-274: Ingestion Error Surfacing & Destructive Toast Feedback
- Enter an invalid or non-existent repository (e.g. `https://github.com/nonexistent_user_9999/does-not-exist`):
- Click "Ingest Repository":
- **Verify**: Server returns HTTP 422 with specific error details.
- **Verify**: Admin UI surfaces the exact error in a red destructive 3D toast (does NOT claim "Successfully ingested 0 repository").

### TC-275: License Verification & OSI Classification Accuracy
- Ingest repos with various licenses (`MIT`, `Apache-2.0`, `GPL-3.0`, `Proprietary`, `No License`):
- **Verify**: Verified OSS licenses receive `verified_oss` status and green badge.
- **Verify**: Non-OSS licenses receive `non_oss` status and yellow/red flags.

### TC-276: Repository Studio Editorial Boost, Staff Pick & Flag Mutations
- In Admin Repository Studio, click "Edit / Boost" on any repository:
- Modify Display Name, Description, set Openlysts Score Booster (e.g. `+15`), and check "Mark as Staff Pick":
- Click "Save Changes":
- **Verify**: Backend processes `PATCH /api/admin/repos/:id` with integer boolean mapping and persists values to PostgreSQL.
- **Verify**: Drawer closes, 3D success toast appears, and repository table instantly reflects the Gold `Staff Pick` badge and boosted score (e.g. `95 +15`).
- **Verify**: In-memory cache is invalidated and fresh boosted scores propagate to Discovery and Alternatives.

---

## PHASE 21: Deep Security, Role-Based Access Control & Audit Trails

### TC-281: Admin Hypervisor Route Isolation
- Attempt direct HTTP requests to `/api/admin/*` endpoints as an unauthenticated guest or standard `USER` role:
- **Verify**: Server responds with HTTP 401 Unauthorized or HTTP 403 Forbidden.
- **Verify**: Admin frontend route `/admin` redirects unauthorized users immediately to `/login`.

### TC-282: Live Security Audit Trail Logging
- Perform administrative operations (user deletion, repo metadata edit, query sync):
- **Verify**: Every action generates an immutable record in `"AuditLog"` containing `actor_id`, `action`, `ip_address`, `user_agent`, and payload metadata.
- **Verify**: Admin Security Audit tab renders recent events in real-time.

### TC-283: Last-Admin Permanent Lockout Guard
- Attempt to delete or demote the sole remaining administrator account:
- **Verify**: Backend blocks operation with `Cannot delete or demote the last remaining active administrator.`
- **Verify**: Red security toast warns the user of the safeguard.

---

## PHASE 22: Cache Invalidation & Telemetry Consistency

### TC-291: In-Memory Cache Invalidation on Mutation
- After any repository ingestion, update, or deletion:
- **Verify**: `invalidateRepositoriesCache()` clears stale cache immediately.
- **Verify**: Subsequent calls to `/api/functions/queryRepositories` return fresh data from DB within sub-20ms.

### TC-292: Telemetry Table Storage Counter Consistency
- In Admin Telemetry & Vitals tab:
- **Verify**: Repository, User, Query, and Audit Log counters match actual `SELECT COUNT(*)` values in PostgreSQL database.

---

## PHASE 23: Mobile Experience, PWA Installability & Universal Route Resilience

### TC-293: Mobile Repository Card Tap Navigation & Touch Gestures
- On mobile viewports (e.g. 390x844 iPhone / Android):
- Tap any repository card in `/discover`, `/search`, `/trending`, or `/bookmarks`:
- **Verify**: Tapping anywhere on the card (or the repository title `<Link>`) cleanly triggers client-side navigation to `/repo/:owner/:name`.
- **Verify**: 3D mouse parallax tilt is safely disabled on coarse/touch screens, preventing touch scroll conflicts or dropped tap events.
- **Verify**: Nested bookmark and compare buttons remain independently clickable without triggering navigation.

### TC-294: Case-Insensitive Repository Querying & GitHub API Fallback
- Navigate to repository routes with mixed casing (e.g. `/repo/amruthpillai/reactive-resume`, `/repo/AmruthPillai/Reactive-Resume`):
- **Verify**: `EntityService.filter` performs case-insensitive database matching (`LOWER(full_name) = LOWER($1)`).
- **Verify**: Detail view loads repository data, stats, README, and similar repos cleanly without "Repository not found" errors.
- **Verify**: If a repository is not present in the local database, it falls back to public GitHub API fetch gracefully.

### TC-295: PWA Web App Manifest, Service Worker & Native Installation Support
- Inspect application on mobile and desktop browsers:
- **Verify**: `manifest.json` contains valid standalone configuration, theme colors, 192x192 and 512x512 icons, and maskable icons.
- **Verify**: `sw.js` Service Worker registers successfully on load with offline fallback caching.
- **Verify**: Browser fires `beforeinstallprompt` event.
- **Verify**: "Install Openlysts App" action appears in Mobile Navigation Drawer and Header, opening native prompt or iOS step-by-step guide.

### TC-296: PWA WebAPK Minting Integrity, Exact Icon Geometry & Enterprise Security Headers
- Inspect PWA security posture and WebAPK minting parameters:
- **Verify**: All PWA PNG icons (`icon-192x192.png`, `icon-512x512.png`, `icon-maskable-192x192.png`, `icon-maskable-512x512.png`, `apple-touch-icon.png`) have exact binary dimensions matching declared manifest sizes with safe-zone padding.
- **Verify**: `manifest.json` defines explicit `id: "/"`, `display_override`, `scope: "/"`, and `prefer_related_applications: false`.
- **Verify**: `sw.js` strictly isolates fetch interception to same-origin URLs (`event.request.url.startsWith(self.location.origin)`), eliminating cross-origin interception warnings.
- **Verify**: `vercel.json` provides enterprise security headers (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy`).


---

# 10/10 QA GOVERNANCE, COVERAGE GAP CLOSURE & EXECUTION CONTROL ADDENDUM

> **Purpose:** This addendum strengthens the existing skill without deleting or weakening any existing rule, phase, persona, test case, reporting requirement, or execution requirement. The complete original skill remains intact above. This section is additive and is the canonical control layer for executing the full suite.

## A. Non-Destructive Maintenance Rule

1. Existing test cases are **immutable by default**.
2. Never delete an existing TC because it appears duplicated, outdated, overly specific, or overlapping.
3. Never silently weaken an existing expected result.
4. If an existing test conflicts with another test, execute both and record the conflict as a **test-suite inconsistency**, not as a reason to skip either test.
5. New coverage must use a new test-case ID and must never recycle an existing ID.
6. Preserve all application-specific terminology, route names, API names, database table names, storage keys, UI labels, and implementation-specific assertions already present in this skill.
7. When the application evolves, add a new regression test rather than rewriting historical coverage unless the user explicitly authorizes replacement.

---

## B. Canonical Test Execution Hierarchy

Execute testing in this order:

1. **Environment Gate**
2. **Application Smoke / P0 Gate**
3. **Application Shell & Routing**
4. **Core User Journeys**
5. **Feature-Level Functional Tests**
6. **Data Integrity & Backend Contract Tests**
7. **Authentication / Authorization**
8. **Security / Abuse Resistance**
9. **Accessibility**
10. **Responsive / Device Matrix**
11. **Resilience / Failure Injection**
12. **Performance / Resource Tests**
13. **PWA / Offline / Multi-Tab**
14. **Admin / Operations**
15. **Cross-Feature Regression**
16. **Cleanup & Evidence Verification**
17. **Final Release Gate**

The existing numbered phases and all their test cases remain mandatory. This hierarchy is an execution-control layer and does not replace them.

---

## C. Mandatory Per-Test Evidence Protocol

For **every** executed test case:

- Record TC ID.
- Record start and end time.
- Record viewport size and browser state where relevant.
- Record authenticated role where relevant: Guest / USER / ADMIN.
- Record prerequisite state.
- Execute the test physically through Playwright MCP.
- Capture the required screenshot(s).
- Capture console errors/warnings after navigation and after major state changes.
- Inspect relevant network requests for API-backed behavior.
- Record the actual observed result.
- Mark exactly one status:
  - `PASS`
  - `FAIL`
  - `BLOCKED`
  - `NOT APPLICABLE` — only when the feature genuinely does not exist.
- **Never** use `ASSUMED PASS`.
- If blocked, record the exact blocker and do not convert the blocker into a pass.
- If a test changes application data, record the created entity and cleanup action.
- If a test changes account state, restore the account to its original state unless the test specifically requires persistence.
- For security tests, never use destructive payloads against production data or production infrastructure.

### Minimum Evidence Bundle

Each failed or blocked test should have, where technically possible:

1. Screenshot
2. Console output
3. Relevant network request/response
4. URL
5. Reproduction steps
6. Expected result
7. Actual result
8. Severity
9. Suggested root-cause area
10. Cleanup status

---

## D. Severity Model

Use the existing P0-P3 model consistently:

### P0 — Release Blocking
Examples:
- Authentication bypass
- Admin/RBAC bypass
- Sensitive credential/token disclosure
- Stored XSS affecting privileged users
- Data corruption
- Repository/category counts materially contradict backend truth
- Core application unavailable or blank
- Destructive action possible without authorization

### P1 — Critical Functional / Security
Examples:
- Major feature unusable
- Persistent data loss
- Broken login/session lifecycle
- Broken ingestion pipeline
- Severe accessibility barrier
- API contract failure affecting core journeys
- Major performance regression

### P2 — Significant
Examples:
- Important edge case failure
- Non-critical workflow failure
- Moderate responsive issue
- Degraded performance without outage
- Incorrect non-critical metadata

### P3 — Cosmetic / Minor
Examples:
- Visual polish
- Minor spacing
- Non-blocking animation issue
- Copy inconsistency

---

## E. Coverage Matrix Requirement

Before declaring the suite complete, build a coverage matrix mapping:

| Coverage Domain | Required Evidence |
|---|---|
| Public routes | Every route tested |
| Protected routes | Guest + USER + ADMIN |
| APIs | Every user-facing API exercised |
| Forms | Empty + valid + invalid + boundary + abuse |
| CRUD | Create + read + update + delete + cancellation |
| Search | Query + filters + sorting + pagination + malformed input |
| Authentication | Register + login + logout + expiry + reset + OAuth |
| Authorization | Guest + USER + ADMIN + direct API access |
| Security | XSS + SQLi + CSRF + SSRF + traversal + IDOR/BOLA + headers |
| Accessibility | Keyboard + focus + semantics + contrast + zoom + motion |
| Responsive | 320/360/375/390/412/430/768/1024/1280/1366/1440/1920 |
| Resilience | Offline + 4xx + 5xx + timeout + malformed payload + retry |
| Performance | Cold + warm + cache hit + cache miss + stress |
| Data integrity | DB ↔ API ↔ UI consistency |
| PWA | Manifest + SW + cache + install + offline |
| Admin | Every destructive and privileged operation |
| Cleanup | Test data and artifacts removed |

No release is `10/10` until every applicable row has evidence.

---

# PHASE 25: API CONTRACT, DATA INTEGRITY & PAGINATION GAP CLOSURE

### TC-331: API Response Contract Validation

- Exercise every user-facing `/api/*` endpoint discovered through network inspection.
- **Verify**: HTTP status matches the documented/expected success or error condition.
- **Verify**: JSON responses have the expected content type.
- **Verify**: Required fields are present.
- **Verify**: Numeric fields are numeric, booleans are booleans, arrays are arrays, and nullable fields are handled consistently.
- **Verify**: No unexpected HTML error page is returned from an API endpoint.
- **Verify**: Malformed responses fail gracefully in the UI.

### TC-332: API Error Contract Matrix

For representative API endpoints, test:

- `400`
- `401`
- `403`
- `404`
- `409`
- `422`
- `429`
- `500`
- `502`
- `503`
- timeout/network failure

- **Verify**: UI displays an appropriate state for each.
- **Verify**: No raw stack traces, SQL errors, secrets, or internal filesystem paths are exposed.

### TC-333: Pagination Boundary Matrix

For every paginated endpoint/page:

- Test page `1`.
- Test the final valid page.
- Test page `0`.
- Test negative page.
- Test a page beyond the final page.
- Test invalid/non-numeric page.
- Test `perPage=1`.
- Test maximum supported page size.
- Test excessive page size.
- **Verify**: No duplicate or missing records at page boundaries.
- **Verify**: Total counts remain consistent.
- **Verify**: UI disables or hides impossible navigation controls.

### TC-334: Sorting Correctness & Stable Ordering

For every supported sort:

- Capture the first N results.
- Verify values are actually monotonic according to the selected sort.
- Repeat the same request twice.
- **Verify**: Equal-valued records have stable deterministic ordering.
- **Verify**: Sort changes do not silently alter unrelated filters.

### TC-335: Filter Combination Truth Table

Test:

- Category only
- Language only
- License only
- Stars only
- Category + language
- Category + license
- Language + license
- Category + language + license + stars
- Search + every filter
- Search + sort + pagination

- **Verify**: Every result satisfies every active filter.
- **Verify**: Removing one filter changes only the expected constraint.
- **Verify**: Clear-all returns to the unfiltered dataset.

### TC-336: API/UI Count Integrity

For every count displayed in the UI:

- Capture the UI count.
- Capture the corresponding API `total`.
- Where available, verify the database count.
- **Verify**: UI → API → DB values are consistent within an explicitly documented live-data tolerance.
- **Bug**: Any unexplained zero, stale count, negative count, NaN, or impossible value is a data-integrity defect.

### TC-337: Cache Hit/Miss Correctness

- Execute a cold query.
- Execute the same query again.
- Mutate the underlying data.
- Execute the same query again.
- **Verify**: Cache hit is fast.
- **Verify**: Mutation invalidates affected cache entries.
- **Verify**: Unaffected cache entries remain usable.
- **Verify**: No stale deleted/updated repository is returned after mutation.

### TC-338: Concurrent Mutation Consistency

- Open two sessions.
- Update the same repository from both sessions.
- Perform simultaneous bookmark/profile/admin mutations where applicable.
- **Verify**: No corrupted partial state.
- **Verify**: Last-write behavior is deterministic or conflict handling is explicit.
- **Verify**: Database remains internally consistent.

---

# PHASE 26: AUTHENTICATION, SESSION & ACCOUNT SECURITY GAP CLOSURE

### TC-339: Session Cookie Security Attributes

If authentication uses cookies:

- Inspect session/auth cookies.
- **Verify**: `HttpOnly` is enabled where appropriate.
- **Verify**: `Secure` is enabled in HTTPS environments.
- **Verify**: `SameSite` is appropriately restrictive.
- **Verify**: Cookie path/domain/scope is not broader than necessary.
- **Verify**: No sensitive session token is duplicated into unsafe client-visible storage without an explicit reason.

### TC-340: Session Fixation Resistance

- Establish a guest session.
- Authenticate.
- **Verify**: Authentication establishes a new authenticated session identifier where applicable.
- Logout.
- Reuse the old session identifier if technically possible.
- **Verify**: It cannot restore the authenticated session.

### TC-341: Concurrent Session Logout Semantics

- Authenticate in Tab A and Tab B.
- Log out from Tab A.
- **Verify**: Tab B receives the expected session invalidation behavior.
- Trigger a protected request from Tab B.
- **Verify**: Access is denied or session is refreshed according to the application's documented policy.

### TC-342: Password Reset Token Replay Protection

- Generate a password reset link.
- Use it successfully once.
- Attempt to reuse the same token.
- **Verify**: Reuse is rejected.
- **Verify**: Expired tokens are rejected.
- **Verify**: Invalid tokens do not reveal whether another valid token exists.

### TC-343: Password Reset Token Enumeration Resistance

- Submit valid-looking, invalid, expired, and random reset tokens.
- **Verify**: Responses do not reveal sensitive token/account state beyond what the UX requires.

### TC-344: Account Enumeration Resistance

- Test registration, login, password reset, and OAuth linking with existing and non-existing accounts.
- **Verify**: Error responses do not unnecessarily disclose whether a target account exists.

### TC-345: Authentication Rate Limiting

- Repeatedly submit invalid login attempts within a short interval.
- **Verify**: Rate limiting, progressive delay, CAPTCHA, lockout, or equivalent protection activates according to the application policy.
- **Verify**: Legitimate users can recover without permanent accidental lockout.

### TC-346: Authorization Enforcement at API Layer

For every protected API endpoint:

- Call endpoint unauthenticated.
- Call endpoint as USER.
- Call endpoint as ADMIN where applicable.
- **Verify**: Authorization is enforced server-side.
- **Verify**: Hiding a UI control never acts as the sole authorization mechanism.

### TC-347: IDOR/BOLA Repository & User Resource Testing

- Modify repository/user/resource IDs in API requests.
- **Verify**: A user cannot read or mutate another user's private resource.
- **Verify**: Sequential IDs, UUIDs, slugs, and alternate identifiers do not bypass authorization.

---

# PHASE 27: SECURITY GAP CLOSURE — SSRF, CORS, INPUT & CONTENT SECURITY

### TC-348: SSRF Protection on URL-Consuming Features

For every feature accepting a URL:

- Test localhost URLs.
- Test private RFC1918 addresses.
- Test loopback addresses.
- Test link-local metadata addresses.
- Test alternative IP representations.
- Test redirects to private addresses.
- **Verify**: Server refuses unauthorized internal-network access.
- **Verify**: No cloud metadata, internal service, filesystem, or secret content is returned.

### TC-349: CORS Preflight & Origin Matrix

Test:

- Same-origin request.
- Authorized origin.
- Unauthorized origin.
- `null` origin.
- Malformed Origin header.
- OPTIONS preflight.
- Credentialed request.

- **Verify**: Only intended origins are allowed.
- **Verify**: Credentials are never combined with an unrestricted wildcard origin.

### TC-350: Content-Type Confusion / Request Smuggling Resistance

- Send JSON endpoints with incorrect or ambiguous content types.
- Send malformed JSON.
- Send duplicate/conflicting headers where supported by the browser tooling.
- **Verify**: Server rejects malformed requests cleanly.
- **Verify**: No unexpected parser disagreement or privilege escalation occurs.

### TC-351: DOM XSS Beyond Search Inputs

Test untrusted data in:

- Repository name
- Description
- Topics
- README
- User display name
- Bio
- Contact message
- Alternative metadata
- Admin notes
- URL parameters
- Error messages

- **Verify**: No script execution.
- **Verify**: Dangerous HTML attributes are neutralized.
- **Verify**: Stored payloads remain inert after reload and in other users' views.

### TC-352: Markdown / README Sanitization Matrix

Test:

- `<script>`
- `<img onerror>`
- `<iframe>`
- `<object>`
- `<embed>`
- dangerous links
- `javascript:` URLs
- data URLs where applicable
- SVG payloads

- **Verify**: Markdown remains readable while active content is safely sanitized.

### TC-353: Security Header Completeness

Inspect all relevant document and API responses for applicable:

- CSP
- HSTS in HTTPS deployment
- X-Content-Type-Options
- Referrer-Policy
- frame protections
- Permissions-Policy
- appropriate CORS headers

- **Verify**: Headers are consistent across route types and error responses where applicable.

---

# PHASE 28: ACCESSIBILITY GAP CLOSURE

### TC-354: Browser Zoom 200% / 400% Reflow

- Test 200% and 400% browser zoom.
- **Verify**: Core content remains readable.
- **Verify**: No critical controls disappear.
- **Verify**: No horizontal scrolling is introduced for normal content except intentionally scrollable components.

### TC-355: Reduced Motion Preference

- Enable `prefers-reduced-motion: reduce`.
- Test navigation, modals, 3D backgrounds, card hover, toasts, drawers, and page transitions.
- **Verify**: Non-essential motion is reduced or disabled.
- **Verify**: Functionality remains intact.

### TC-356: Focus Visible & Focus Restoration Matrix

For every modal/drawer/popover:

- Open with keyboard.
- Verify focus enters the component.
- Close with Escape or action.
- Verify focus returns to the initiating control.
- Verify no hidden element retains focus.

### TC-357: Form Accessibility Matrix

For every form:

- Verify visible labels.
- Verify programmatic labels.
- Verify required fields expose required state.
- Verify invalid fields expose error state.
- Verify errors are associated with the correct field.
- Verify submission errors are announced appropriately.
- Verify keyboard-only completion.

### TC-358: Accessible Name Uniqueness

- Inspect icon-only buttons, links, toggles, and navigation controls.
- **Verify**: Every interactive control has a meaningful accessible name.
- **Verify**: Duplicate labels are intentional and distinguishable by context.

### TC-359: Heading Hierarchy & Landmark Integrity Across All Routes

- Inspect every route.
- **Verify**: Heading levels do not skip arbitrarily.
- **Verify**: Main landmark is unique.
- **Verify**: Navigation and complementary landmarks are meaningful.
- **Verify**: Dialogs are correctly excluded from the normal page landmark hierarchy.

### TC-360: Keyboard Trap / Escape / Tab-Cycle Exhaustion

For every interactive overlay:

- Open with keyboard.
- Tab forward through every focusable element.
- Shift+Tab backward.
- Press Escape.
- **Verify**: No accidental keyboard trap.
- **Verify**: No focus escape into obscured background content.

---

# PHASE 29: RESILIENCE, NETWORK FAILURE & RECOVERY

### TC-361: API Timeout Recovery

- Simulate API requests that never resolve or resolve after a long delay.
- **Verify**: Loading state does not remain indefinitely.
- **Verify**: Timeout/error state is shown.
- **Verify**: Retry action works.
- **Verify**: Retrying does not create duplicate requests.

### TC-362: API 429 Rate-Limit Recovery

- Simulate `429 Too Many Requests`.
- **Verify**: UI displays rate-limit state.
- **Verify**: Retry respects server-provided timing when available.
- **Verify**: No aggressive retry storm occurs.

### TC-363: Partial Dependency Failure

Simulate one dependency failing while others succeed.

Examples:

- GitHub API fails but Neon succeeds.
- Neon fails but cached data exists.
- Video service fails but repository data succeeds.
- Translation service fails but original text exists.

- **Verify**: Working features remain usable.
- **Verify**: Failure is isolated rather than crashing the entire page.

### TC-364: Retry Idempotency

- Trigger retry after a failed create/update/ingestion operation.
- **Verify**: Retry does not duplicate records.
- **Verify**: Idempotency keys or equivalent safeguards work where required.

### TC-365: Browser Refresh During Mutation

- Start ingestion, save profile, update repository, or another long-running mutation.
- Refresh during the operation.
- **Verify**: Application recovers to a truthful state.
- **Verify**: Operation is not silently duplicated.
- **Verify**: User sees final status when the backend completed successfully.

### TC-366: Navigation During Loading

- Start a slow search/API request.
- Navigate to another page immediately.
- **Verify**: Old request cannot overwrite the new page's state.
- **Verify**: No stale results appear on the destination page.
- **Verify**: Abort/cancellation behavior is clean where supported.

---

# PHASE 30: PERFORMANCE, CORE WEB VITALS & RESOURCE GOVERNANCE

### TC-367: Warm vs Cold Performance Comparison

- Measure cold load.
- Measure warm cache load.
- Compare:
  - DCL
  - FCP
  - LCP where available
  - request count
  - transferred bytes
- **Verify**: Warm-cache behavior improves without serving stale content.

### TC-368: Largest Contentful Paint Stability

- Measure LCP on key routes.
- Repeat at least 3 times.
- **Verify**: No single asset causes unpredictable LCP spikes.
- **Document**: median and worst observed result.

### TC-369: Cumulative Layout Shift Audit

- Load each major route.
- Observe layout during:
  - image loading
  - font loading
  - repository cards loading
  - live counters
  - 3D canvas initialization
  - ads/external embeds if applicable
- **Verify**: Major content does not unexpectedly jump.

### TC-370: Long Task / Main Thread Blocking Audit

- Observe long tasks during:
  - initial load
  - search
  - scrolling
  - opening modals
  - changing filters
  - switching themes
  - 3D interactions
- **Verify**: No sustained main-thread blocking that makes the UI unresponsive.

### TC-371: Network Request Duplication Audit

- Open each major route.
- Record API requests.
- Navigate back and forward.
- **Verify**: No accidental duplicate requests caused by remount loops.
- **Verify**: Cache behavior matches the intended TanStack Query strategy.

### TC-372: Asset Failure Fallback

- Block representative images, fonts, video thumbnails, and non-critical assets.
- **Verify**: Layout remains stable.
- **Verify**: Alt text/fallback UI appears where applicable.
- **Verify**: Critical application functionality remains usable.

### TC-373: WebGL Context Loss & Recovery

- Simulate or trigger WebGL context loss where supported.
- **Verify**: Application does not crash.
- **Verify**: Non-WebGL UI remains functional.
- **Verify**: Canvas recovers or falls back gracefully.

---

# PHASE 31: PWA, OFFLINE CACHE & SERVICE-WORKER GAP CLOSURE

### TC-374: Service Worker Update Lifecycle

- Install version A.
- Deploy/version version B or simulate a changed service worker.
- **Verify**: New worker installs correctly.
- **Verify**: Old worker does not permanently block updates.
- **Verify**: User receives the intended update behavior.

### TC-375: Cache Versioning & Stale Asset Prevention

- Inspect service-worker cache names.
- Install an updated application build.
- **Verify**: Old hashed assets do not remain the active source after successful update.
- **Verify**: No mixed-version JavaScript/CSS causes runtime crashes.

### TC-376: Offline Navigation Matrix

After visiting key routes online:

- Disable network.
- Reload:
  - `/`
  - `/discover`
  - `/search`
  - `/alternatives`
  - `/trending`
  - `/bookmarks`
  - `/repo/:owner/:name`
- **Verify**: Each route follows the intended offline behavior.
- **Verify**: No blank page or unhandled exception.

### TC-377: Offline Mutation Safety

- Go offline.
- Attempt bookmark/profile/admin mutation where relevant.
- **Verify**: App does not falsely claim server persistence.
- **Verify**: User receives truthful offline feedback.
- **Verify**: Reconnection does not create duplicate mutations.

### TC-378: Storage Quota Exhaustion

- Simulate near-full local storage/cache where practical.
- Attempt bookmark/history/settings/cache writes.
- **Verify**: Application handles quota errors without crashing.
- **Verify**: Critical state remains recoverable.

---

# PHASE 32: ADMIN OPERATIONS & DESTRUCTIVE ACTION GAP CLOSURE

### TC-379: Admin Destructive Action Double Confirmation

For delete/purge operations:

- Open destructive action.
- Cancel.
- Reopen.
- Attempt rapid confirmation clicks.
- **Verify**: Exactly one destructive mutation occurs.
- **Verify**: Confirmation clearly identifies the target.

### TC-380: Admin Bulk Operation Partial Failure

- Select multiple repositories/users.
- Force one selected item to fail while others succeed.
- **Verify**: Successful and failed items are separately reported.
- **Verify**: No false all-success message.
- **Verify**: Retry can target failed items only where supported.

### TC-381: Admin Audit Log Immutability

- Create an audit event.
- Attempt to mutate/delete it through the UI/API as ADMIN.
- **Verify**: Audit record cannot be altered through normal administrative privileges unless an explicit retention mechanism exists.
- **Verify**: Security-relevant fields remain intact.

### TC-382: Admin Privilege Boundary on Secondary Routes

- Discover every `/admin/*` and admin-related API route.
- Test direct navigation and direct API access as Guest, USER, and ADMIN.
- **Verify**: No secondary admin screen/API bypasses the primary guard.

### TC-383: Admin Token Secret Handling

- Inspect token/PAT management UI and API responses.
- **Verify**: Full secret values are never unnecessarily rendered, logged, or returned to the browser.
- **Verify**: Masked values cannot be trivially recovered from DOM/source/network responses.

### TC-384: Admin Operation Audit Correlation

For destructive/privileged operations:

- Capture UI action.
- Capture network request.
- Capture resulting DB state.
- Capture audit record.
- **Verify**: Actor, target, action, timestamp, and outcome correlate correctly.

---

# PHASE 33: SEARCH, URL STATE & DEEP-LINK GAP CLOSURE

### TC-385: URL Encoding Round-Trip Matrix

Test queries containing:

- spaces
- `+`
- `%`
- `&`
- `=`
- `#`
- `?`
- Unicode
- emoji
- slash
- comma

- **Verify**: Entered state survives URL encoding/decoding without semantic corruption.

### TC-386: Browser Refresh URL State Preservation

- Apply every supported search/filter/sort combination.
- Refresh the browser.
- **Verify**: Search input, filters, sort, page, and visible results remain synchronized with the URL.

### TC-387: Shareable Deep Link Integrity

- Create a complex search URL.
- Copy it.
- Open in a fresh browser context.
- **Verify**: The fresh context reconstructs the same search state without relying on previous local state.

### TC-388: Unknown Query Parameter Tolerance

- Add unknown parameters to valid routes.
- **Verify**: Application ignores harmless unknown parameters without crashing or changing protected behavior.

### TC-389: Duplicate Query Parameter Handling

- Test repeated parameters such as:
  - `categories=ai&categories=ai`
  - repeated sort
  - repeated page
- **Verify**: Behavior is deterministic and safe.
- **Verify**: Duplicate parameters cannot bypass filters or authorization.

---

# PHASE 34: CROSS-BROWSER / ENGINE COMPATIBILITY

### TC-390: Chromium Baseline Regression

- Run critical smoke flows in Chromium.
- **Verify**: All P0/P1 journeys pass.

### TC-391: Firefox Compatibility Matrix

Where browser support is intended:

- Run shell, navigation, search, forms, auth, modals, responsive behavior, and PWA-compatible functionality.
- **Verify**: No engine-specific breakage.

### TC-392: WebKit / Safari Compatibility Matrix

Where browser support is intended:

- Test mobile viewport behavior, touch scrolling, forms, modals, video, PWA behavior, and CSS viewport units.
- **Verify**: No Safari-specific layout or interaction failures.

### TC-393: Browser Feature Fallback Audit

- Identify APIs requiring optional browser support.
- **Verify**: Unsupported APIs have graceful fallbacks.
- **Verify**: Feature detection is used instead of assuming support.

---

# PHASE 35: FINAL RELEASE GATE & SUITE QUALITY CONTROL

### TC-394: Test Case Numbering Integrity

- Parse all `TC-XXX` identifiers in this skill.
- **Verify**: No duplicate IDs exist.
- **Verify**: Newly added tests use unique IDs.
- **Verify**: Existing historical IDs remain unchanged.

### TC-395: Phase Numbering Integrity

- Parse every `PHASE N`.
- **Verify**: Duplicate phase numbers are explicitly documented if retained for historical compatibility.
- **Verify**: The canonical execution hierarchy above is used to resolve execution order.
- **Verify**: No phase is silently skipped because of numbering inconsistencies.

### TC-396: Requirement-to-Test Traceability

- Extract major application capabilities from the skill:
  - discovery
  - search
  - filters
  - alternatives
  - repositories
  - bookmarks
  - compare
  - contact
  - themes
  - accessibility
  - responsive
  - security
  - resilience
  - performance
  - auth
  - admin
  - video
  - translation
  - database
  - ingestion
  - PWA
  - profile
  - OAuth
  - toasts
- **Verify**: Every capability has at least one positive test and one negative/boundary test where applicable.

### TC-397: No-Assumption Final Sweep

- Review every test marked PASS.
- **Verify**: Evidence exists for every PASS.
- **Verify**: No PASS was inferred from source code alone when physical browser interaction was required.
- **Verify**: No test was silently skipped because it was inconvenient or repetitive.

### TC-398: Regression Re-Run of Every Previously Failed P0/P1

- Extract all historical P0/P1 failures.
- Re-run each after fixes.
- **Verify**: Fixed behavior passes.
- **Verify**: No adjacent regression is introduced.

### TC-399: Clean-State Re-Run

- Clear appropriate browser state.
- Start a fresh browser context.
- Run core smoke suite again.
- **Verify**: Results do not depend on stale localStorage, cache, session, service-worker state, or prior test data.

### TC-400: Final Release Candidate Gate

The application may be declared **10/10 QA READY** only when:

- All mandatory tests are `PASS`, or explicitly justified `BLOCKED`.
- No unresolved P0 exists.
- No unresolved P1 exists without explicit release approval.
- Authentication and authorization are verified at both UI and API layers.
- Core user journeys pass on supported device classes.
- Security regression suite passes.
- Accessibility suite passes at the application's stated support level.
- Performance thresholds are met or deviations are explicitly approved.
- Database/API/UI counts are reconciled.
- Cache invalidation is verified.
- Test artifacts are complete.
- Test data is cleaned.
- Final screenshots/evidence exist for failures and key release gates.
- `qa_exhaustive_report.md` contains the final truthful status.

---

# FINAL EXECUTION RULES — 10/10 STANDARD

## Rule A — Never Substitute Inspection for Execution

Source inspection can supplement a test, but it does not replace physical browser execution when the test requires observable UI behavior.

## Rule B — Never Substitute a Screenshot for Functional Verification

A screenshot proves appearance at one moment. It does not prove functionality, state persistence, navigation, network behavior, accessibility, or data correctness.

## Rule C — Never Substitute a Passing API for a Passing UI

A healthy endpoint does not prove that the UI:
- sends the correct parameters,
- handles loading,
- handles errors,
- renders the response,
- updates state,
- preserves state,
- or provides accessible interaction.

## Rule D — Never Substitute a Passing UI for Authorization

A hidden button or protected route is not sufficient evidence. Direct API authorization must be tested.

## Rule E — Always Test the Negative Path

Every major mutation, query, authentication flow, navigation flow, and external dependency must have an applicable failure/negative test.

## Rule F — Always Test State Transitions

For every feature with state:

`initial → loading → success → failure → retry → persisted → reload → restored`

where applicable.

## Rule G — Always Test Cross-Feature Effects

Examples:

- Bookmark → BottomNav count → Bookmarks page → localStorage → multi-tab sync.
- Category chip → URL → backend slug mapping → results → count → back navigation.
- Admin edit → DB → cache invalidation → public Discover → Repo Detail.
- Login → session → protected route → refresh → second tab → logout.
- Ingestion → DB → cache → counts → category metrics → public UI.

## Rule H — Treat Data Integrity as a First-Class QA Domain

A visually correct card containing incorrect repository data is a failure.

## Rule I — Treat Security as a First-Class QA Domain

Any evidence of:
- authorization bypass,
- secret leakage,
- XSS,
- SQL injection,
- SSRF,
- IDOR/BOLA,
- session compromise,
- insecure cookies,
- unsafe redirects,

must be escalated immediately.

## Rule J — Final Report Must Be Truthful

Never optimize the pass rate by:
- skipping tests,
- redefining expected behavior after failure,
- converting BLOCKED to PASS,
- hiding known defects,
- or claiming execution that did not happen.

---

# FINAL REPORT ENHANCEMENT

In addition to the existing `qa_exhaustive_report.md` template, include:

```markdown
## Test Execution Metadata

- Application URL:
- Backend health URL:
- Test date:
- Browser / engine:
- Viewport matrix:
- Auth roles exercised:
- GitHub/API environment:
- Database environment:
- Build / commit:
- Test suite version:

## Coverage

- Total test cases:
- Executed:
- Passed:
- Failed:
- Blocked:
- Not Applicable:
- Evidence completeness:
- P0 open:
- P1 open:
- P2 open:
- P3 open:

## Coverage by Domain

| Domain | Tests | Pass | Fail | Blocked |
|---|---:|---:|---:|---:|
| Smoke / Shell | | | | |
| Routing | | | | |
| Search | | | | |
| Filters | | | | |
| Repository | | | | |
| Alternatives | | | | |
| Bookmarks | | | | |
| Compare | | | | |
| Forms | | | | |
| Authentication | | | | |
| Authorization | | | | |
| Admin | | | | |
| Security | | | | |
| Accessibility | | | | |
| Responsive | | | | |
| Resilience | | | | |
| Performance | | | | |
| PWA / Offline | | | | |
| Data Integrity | | | | |

## Release Gate

- [ ] No unresolved P0
- [ ] No unresolved P1 without explicit approval
- [ ] Core smoke suite passes
- [ ] Authentication passes
- [ ] Authorization passes at API layer
- [ ] Security regression passes
- [ ] Accessibility regression passes
- [ ] Responsive matrix passes
- [ ] Performance thresholds verified
- [ ] Data integrity verified
- [ ] Cache invalidation verified
- [ ] Test data cleaned
- [ ] Evidence complete
- [ ] Final report saved
- [ ] Browser closed
- [ ] Final release decision recorded

## Known Test-Suite Inconsistencies

Record, but do not silently alter, historical inconsistencies such as:
- duplicated reporting-template sections,
- historical phase-number gaps,
- historical test-number gaps,
- feature-specific assertions that may no longer exist,
- conflicting implementation-specific thresholds.

## Final QA Decision

**RELEASE READY / RELEASE BLOCKED / CONDITIONAL**

Reason:
[Truthful explanation]
```

---

# STRUCTURAL REVIEW NOTES — PRESERVE THESE AS MAINTENANCE GUIDANCE

The original skill is exceptionally broad and already contains extensive application-specific coverage. Its principal weakness is **organization and governance rather than lack of raw test volume**.

The preferred long-term structure is:

1. Identity & Mission
2. Non-Negotiable Browser Protocol
3. Environment / Prerequisites
4. Personas
5. Test Data & Account Matrix
6. Severity Model
7. Evidence Rules
8. Execution Hierarchy
9. Functional Test Phases
10. Security Phases
11. Accessibility Phases
12. Responsive / Device Phases
13. Performance Phases
14. Resilience Phases
15. Admin / Operations Phases
16. PWA / Offline Phases
17. Cross-Feature Regression
18. Final Release Gate
19. Reporting
20. Cleanup

**Important:** This recommendation is structural only. The existing test cases above remain preserved and mandatory.

The most important coverage improvements added by this addendum are:

- API contract/schema validation
- API error-contract testing
- pagination boundary testing
- deterministic sorting verification
- complete filter truth-table testing
- API/UI/database count reconciliation
- cache hit/miss correctness
- concurrent mutation integrity
- cookie security
- session fixation resistance
- concurrent session invalidation
- password reset replay protection
- account enumeration resistance
- authentication rate limiting
- API-level authorization
- IDOR/BOLA
- SSRF
- CORS preflight/origin matrix
- content-type/parser robustness
- broader stored DOM XSS
- Markdown/README sanitization
- browser zoom at 200%/400%
- reduced-motion accessibility
- focus restoration and keyboard trap exhaustion
- accessible form error semantics
- API timeout/retry
- 429 handling
- partial dependency failure
- mutation idempotency
- refresh-during-mutation
- stale-request cancellation
- LCP/CLS/main-thread performance
- duplicate network-request detection
- WebGL context-loss recovery
- service-worker update lifecycle
- cache versioning
- offline mutation safety
- storage quota exhaustion
- admin partial-failure handling
- audit immutability/correlation
- URL encoding/round-trip integrity
- cross-browser engine compatibility
- test-ID integrity
- requirement-to-test traceability
- clean-state regression
- historical P0/P1 revalidation
### TC-401: Category Metrics Chip Height, Text Truncation & Number Collision Prevention

- Load homepage (`/` or `/discover`) across responsive viewports: 375px, 768px, 1024px, 1280px, 1440px.
- Inspect `DiscoverLiveMetrics` category chips (all 7 categories).
- **Verify**: Every category chip maintains a minimum height of $\ge 96\text{px}$ and equal heights across the grid (`items-stretch`).
- **Verify**: Long category titles (e.g. "Databases & RAG") truncate with clean ellipsis or wrap without pushing the counter down.
- **Verify**: The numeric count (e.g. `490`) maintains at least 8px padding from the bottom border with zero text collision or clipping.

---

# PHASE 36: ALGORITHMIC METRICS & HYBRID SIMILARITY ENGINE

### TC-402: Authority Score UI Rendering (Core Badge)

- Navigate to `/search` or `/discover`.
- Locate a repository known to have `stars > 25000` (or `authority_score > 40`).
- **Verify**: The UI displays the "Core" badge (ShieldCheck icon, indigo).
- Locate a repository known to have `stars < 5000`.
- **Verify**: The UI does *not* display the "Core" badge.

### TC-403: Engagement Score UI Rendering (Active Badge)

- Navigate to `/search` or `/discover`.
- Locate a repository known to have high recent engagement (e.g., `forks > 5000`, `open_issues < 100`, high `engagement_score > 60`).
- **Verify**: The UI displays the "Active" badge (Activity icon, emerald).
- Locate a repository known to be inactive (e.g., archived or very few forks).
- **Verify**: The UI does *not* display the "Active" badge.

### TC-404: Hybrid Similarity Sorting

- Navigate to a repository detail page (`/repo/:owner/:name`) for a well-known project (e.g., `facebook/react`).
- Check the "Similar Repositories" list.
- **Verify**: Highly popular repositories with similar topics appear before less popular repositories with identical topics. (Verifying the 0.1 authority weight and 0.05 engagement weight are successfully applied to the base similarity score).
- **Verify**: Only repositories with a total `relevance > 2` are returned in the similar results.

---

# PHASE 37: PRODUCT TOUR REGRESSION

### TC-405: Product Tour - First Time Unauthenticated
- Open an incognito browser window or clear `localStorage`.
- Navigate to `http://localhost:5173/` (Homepage).
- **Verify**: The Product Tour popover appears automatically after ~1 second.
- **Verify**: The spotlight highlights the center of the screen first (Welcome).
- **Verify**: Clicking "Next" highlights the Search Bar (`[data-tour="search-bar"]`).
- **Verify**: Clicking "Next" highlights the Filter Bar (`[data-tour="filter-bar"]`).
- **Verify**: Clicking "Next" highlights a Repository Card (`[data-tour="repo-card"]`).
- **Verify**: Clicking "Next" highlights the Auth/Profile Menu (`[data-tour="auth-menu"]`).
- **Verify**: Clicking "Skip" or finishing the tour closes the tour and sets `openlyst_has_seen_tour` in `localStorage` to `'true'`.

### TC-406: Product Tour - Suppression on Reload (Unauthenticated)
- Perform TC-405 to ensure `openlyst_has_seen_tour` is set to `'true'`.
- Reload the page.
- **Verify**: The Product Tour does NOT appear automatically.
- Clear `localStorage`.
- Reload the page.
- **Verify**: The Product Tour appears again.

### TC-407: Product Tour - Suppression (Authenticated)
- Sign in to the application as a user who has completed the tour (`has_seen_tour` = true in DB).
- Ensure `openlyst_has_seen_tour` is NOT in `localStorage` (simulating a new device).
- Reload the page.
- **Verify**: The Product Tour does NOT appear automatically, because the DB state takes precedence and sets the local state.
# PHASE 38: CROSS-DEVICE & SYSTEM INTEGRITY REGRESSION

### TC-408: Mobile Alternatives Category Bottom Sheet Drawer
- Set browser viewport to mobile dimensions ($390 \times 844$).
- Navigate to `http://localhost:5173/alternatives`.
- **Verify**: The "Categories" bottom sheet trigger button is visible.
- Click "Categories" button.
- **Verify**: Category Drawer sheet slides up from the bottom with zero React fatal reference errors.
- Select a category (e.g. "Databases").
- **Verify**: Sheet closes and the alternative list filters dynamically.

### TC-409: Admin Studio Alternatives Feature Parity Score Query
- Navigate to `http://localhost:5173/admin`.
- Switch to the "Alternatives" management tab.
- **Verify**: Backend queries the `Alternative` table using `feature_parity_score` without encountering SQL errors (e.g., `column "quality_score" does not exist`).
- **Verify**: Alternative records render with correct parity score badges and sorting order.

### TC-410: Video Tutorial YouTube Iframe CSP Whitelist
- Navigate to any repository detail page with an embedded video explanation.
- **Verify**: The YouTube iframe loads and displays video content without Content Security Policy blocking violations.
- **Verify**: Browser console shows 0 CSP violations for `https://www.youtube.com` and `https://www.youtube-nocookie.com`.

### TC-411: RepoDetail Category Badges Route to Dynamic Search
- Navigate to `http://localhost:5173/repo/facebook/react`.
- Locate the category badges beneath the repository header.
- Click any category badge (e.g., "Developer Tools").
- **Verify**: Application routes to `/search?categories=developer-tools` instead of navigating to a dead 404 `/category/:slug` endpoint.

### TC-412: Tablet Viewport (1024px-1279px) Hamburger Drawer Navigation
- Set browser viewport width to 1024px (iPad landscape / small laptop).
- Navigate to `http://localhost:5173/discover`.
- Locate and click the hamburger navigation trigger button.
- **Verify**: Navigation drawer slides open cleanly across the 1024px–1279px range with all navigation links accessible.

### TC-413: Compare Dock Pre-Population & Clean State Management
- Select 2 repositories on the Discover page.
- Navigate to `http://localhost:5173/compare` with empty query parameters.
- **Verify**: Application automatically pre-populates URL search parameters from local compare state.
- Add/remove items from the compare dock.
- **Verify**: No React state-updater side-effect warnings (e.g., `Cannot update a component ('Toaster') while rendering a different component`).

### TC-414: Auth Pages CSS Token Theme Resilience
- Navigate to `http://localhost:5173/forgot-password`, `/reset-password`, and `/verify-email`.
- Toggle between Light and Dark themes.
- **Verify**: Container backgrounds, text colors, card borders, and action buttons use design system tokens (`bg-bg`, `text-text`, `bg-bg-card`, `border-border`, `bg-accent`) and remain fully legible in all color schemes.

### TC-415: Trending 7-Day Filter Persistence
- Navigate to `http://localhost:5173/trending`.
- Open the filter panel and select "7 days" under "Updated Within".
- **Verify**: The URL updates to `/trending?updatedWithin=7d` and is preserved without premature default-filter exclusion.

### TC-416: Mobile Bottom Navigation Live Bookmark Badge Synchronization
- Set browser viewport to mobile dimensions ($390 \times 844$).
- Navigate to `http://localhost:5173/discover`.
- Bookmark a repository or dispatch `bookmarks-changed` custom event.
- **Verify**: The `Saved` icon in the bottom navigation bar immediately updates its badge count in real-time.

### TC-417: Search Input Deep-link Synchronization
- Navigate directly to `http://localhost:5173/search?q=open-source`.
- **Verify**: The search input field automatically populates with `"open-source"`.
- Navigate programmatically or via browser history to `http://localhost:5173/search?q=database`.
- **Verify**: The search input updates reactively to match the new query parameter.

### TC-418: PWA Manifest Web Origin Alignment
- Inspect `public/manifest.json`.
- **Verify**: The manifest `id` is relative (`"/"`) rather than an absolute URL, preventing origin mismatches when hosted on custom domains or staging environments.

### TC-419: Non-Admin Trending Refresh Endpoint Security
- Navigate to `http://localhost:5173/` as an unauthenticated or non-admin user.
- Click the "Refresh" button in the Trending Repositories section.
- **Verify**: Application calls public `refetchTrending()` rather than protected admin endpoint `runIngestion`, avoiding unauthenticated 401 errors.

### TC-420: Data Vault Bookmark Export Property Mapping
- Navigate to `http://localhost:5173/profile`.
- Click "Export JSON" in the Data Vault section.
- **Verify**: Exported JSON contains valid repository fields (`name`, `url`, `stars`, `created_date`) without undefined property references.

### TC-421: Platform Guide Interactive Capabilities Hub & Mastery Tracker
- Navigate to `http://localhost:5173/guide`.
- Verify page renders plain-English header "How to Find Awesome Free Software in Seconds" and all 6 capability tabs (Smart Search, Free Alternatives, Side-by-Side Compare, Video Walkthroughs, Save & Export, Fast Shortcuts).
- **Mastery Tracker Verification**:
  - Verify initial progress state displays "Guide Progress: 1 of 6 Features Explored (17%)".
  - Click through all 6 tabs and verify progress increments continuously to 100%.
  - Verify the 100% completion badge ("🏆 You're an Open-Source Power User! Ready to explore?") unlocks with working "Launch App →" link.
- **Goal Intent Selector Verification**:
  - Verify 4 intent shortcut buttons ("Replace a paid $50/mo subscription", "Find clean code without dead clones", "Compare 2 tools without 20 open tabs", "Watch a 5-min video instead of long docs").
  - Click each goal chip and verify immediate tab switching to the corresponding module.
- **Interactive Simulator Verification**:
  - Smart Search: Adjust weight tuner slider and verify live score recalculation.
  - Free Alternatives: Toggle Firebase $\rightarrow$ Supabase and Vercel $\rightarrow$ Coolify comparisons with 1-click Docker details.
  - Side-by-Side Compare: Test deep-link CTA navigation to `/compare`.
  - Fast Shortcuts: Verify keyboard cheat sheet and `<kbd>` tokens.
- Test responsiveness across Desktop ($1280\times 800$), Tablet ($768\times 1024$), and Mobile ($390\times 844$).
- Verify theme switching across Dark and Light modes maintains 100% contrast compliance.

---

# END OF ADDITIVE QA CONTROL LAYER

