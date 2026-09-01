---
name: accessibility-wcag
description: "WCAG 2.1 AA accessibility skill for Openlysts. Covers semantic HTML, keyboard navigation, screen reader support, ARIA patterns, focus management, contrast, and form accessibility."
---

# Accessibility (WCAG 2.1 AA) Skill

## Role & Identity
Accessibility Engineer ensuring Openlysts is usable by everyone — keyboard users, screen reader users, color-blind users, and users with motor impairments.

## Target: WCAG 2.1 Level AA Compliance

---

## 1. Semantic HTML Audit

### Required Landmarks
```html
<!-- Every page must have these -->
<header role="banner">...</header>
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
<footer role="contentinfo">...</footer>
```

### Heading Hierarchy
```html
<!-- Exactly ONE h1 per page, then h2, h3 in order -->
<h1>Page Title</h1>
  <h2>Section 1</h2>
    <h3>Subsection</h3>
  <h2>Section 2</h2>
<!-- NEVER skip levels: h1 → h3 is invalid -->
```

### Landmark Audit Script
```javascript
{
  mainCount: document.querySelectorAll('main, [role="main"]').length,
  navCount: document.querySelectorAll('nav, [role="navigation"]').length,
  headerCount: document.querySelectorAll('header, [role="banner"]').length,
  footerCount: document.querySelectorAll('footer, [role="contentinfo"]').length,
  h1Count: document.querySelectorAll('h1').length,
  skipLink: !!document.querySelector('a[href="#main-content"]'),
  ariaLandmarks: document.querySelectorAll('[role]').length,
}
// All counts should be ≥ 1 (except h1 = exactly 1)
```

---

## 2. Keyboard Navigation

### Tab Order Requirements
```javascript
// Verify focus moves logically
// 1. Skip link (first focusable element)
// 2. Logo/home link
// 3. Nav links (left to right)
// 4. Search input
// 5. Filter controls
// 6. Content cards
// 7. Footer links
```

### Skip Link
```jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded"
>
  Skip to main content
</a>
```

### Focus Styles
```css
/* Visible focus ring for keyboard users */
:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}

/* Remove focus ring for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Keyboard Shortcuts
| Key | Action |
|---|---|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter/Space | Activate buttons and links |
| Escape | Close modals, dropdowns, palettes |
| Arrow keys | Navigate within menus, lists, tabs |

---

## 3. ARIA Patterns

### Modal/Dialog
```jsx
<Dialog.Content
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-description">Dialog description</p>
</Dialog.Content>
```

### Dropdown Menu
```jsx
<DropdownMenu.Trigger
  aria-expanded={isOpen}
  aria-haspopup="menu"
>
  Options
</DropdownMenu.Trigger>
```

### Accordion
```jsx
<Accordion.Header>
  <Accordion.Trigger
    aria-expanded={isOpen}
    aria-controls="panel-content"
  >
    Section Title
  </Accordion.Trigger>
</Accordion.Header>
<Accordion.Content id="panel-content" role="region">
  Content
</Accordion.Content>
```

### Live Regions (Dynamic Content)
```jsx
{/* Announce loading states */}
<div aria-live="polite" aria-atomic="true">
  {isLoading ? 'Loading repositories...' : `${repos.length} repositories found`}
</div>

{/* Announce errors immediately */}
<div aria-live="assertive" role="alert">
  {error && <p>{error.message}</p>}
</div>
```

### Progress Indicators
```jsx
<progress
  value={completedSteps}
  max={totalSteps}
  aria-label={`Step ${completedSteps} of ${totalSteps}`}
/>
```

---

## 4. Form Accessibility

### Label Association
```jsx
{/* GOOD: Explicit label */}
<label htmlFor="email">Email address</label>
<input id="email" type="email" aria-required="true" />

{/* GOOD: Implicit label */}
<label>
  Email address
  <input type="email" aria-required="true" />
</label>

{/* BAD: No label */}
<input type="email" placeholder="Email" />
```

### Error Messages
```jsx
<div>
  <label htmlFor="email">Email address</label>
  <input
    id="email"
    type="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? 'email-error' : undefined}
  />
  {hasError && (
    <p id="email-error" role="alert" className="text-destructive">
      Please enter a valid email address
    </p>
  )}
</div>
```

### Fieldset for Radio/Checkbox Groups
```jsx
<fieldset>
  <legend>Notification preferences</legend>
  <label><input type="radio" name="notify" value="email" /> Email</label>
  <label><input type="radio" name="notify" value="sms" /> SMS</label>
</fieldset>
```

---

## 5. Color & Contrast

### Minimum Contrast Ratios
| Element | Normal Text | Large Text |
|---|---|---|
| Body text | 4.5:1 | 3:1 |
| UI components | 3:1 | 3:1 |
| Focus indicators | 3:1 | 3:1 |

### Contrast Check Script
```javascript
function getContrastRatio(rgb1, rgb2) {
  const luminance = ([r, g, b]) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  const l1 = Math.max(luminance(rgb1), luminance(rgb2));
  const l2 = Math.min(luminance(rgb1), luminance(rgb2));
  return (l1 + 0.05) / (l2 + 0.05);
}

// Test key text elements
Array.from(document.querySelectorAll('p, span, a, h1, h2, h3, button'))
  .filter(el => {
    const style = getComputedStyle(el);
    return parseFloat(style.opacity) < 0.5 || parseFloat(style.fontSize) < 12;
  })
  .map(el => el.textContent?.trim().substring(0, 40));
```

### Don't Rely on Color Alone
```jsx
{/* BAD: Color-only indicator */}
<span className="text-red-500">Error</span>

{/* GOOD: Color + icon + text */}
<span className="text-red-500" role="alert">
  <AlertCircle className="inline" /> Error: Invalid email
</span>
```

---

## 6. Images & Media

### Alt Text Rules
```jsx
{/* Informative image */}
<img src="chart.png" alt="Star growth: 1000 in Jan, 5000 in Dec" />

{/* Decorative image */}
<img src="decorative.svg" alt="" role="presentation" />

{/* Complex image */}
<figure>
  <img src="architecture.png" alt="Openlysts architecture diagram" />
  <figcaption>Figure 1: System architecture overview</figcaption>
</figure>
```

### Video Captions
```jsx
<video controls>
  <source src="tutorial.mp4" />
  <track kind="captions" src="captions.vtt" label="English" default />
</video>
```

---

## 7. Focus Management

### Modal Focus Trap
```javascript
function useFocusTrap(ref) {
  useEffect(() => {
    const focusable = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleTab(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    ref.current.addEventListener('keydown', handleTab);
    first?.focus();
    return () => ref.current.removeEventListener('keydown', handleTab);
  }, [ref]);
}
```

### Route Change Focus
```javascript
// After navigation, move focus to main content
useEffect(() => {
  document.getElementById('main-content')?.focus();
}, [pathname]);
```

---

## 8. Screen Reader Testing

### Audit Script
```javascript
{
  // ARIA attributes
  ariaLabels: document.querySelectorAll('[aria-label]').length,
  ariaDescriptions: document.querySelectorAll('[aria-describedby]').length,
  ariaExpanded: document.querySelectorAll('[aria-expanded]').length,
  ariaLive: document.querySelectorAll('[aria-live]').length,
  ariaHidden: document.querySelectorAll('[aria-hidden]').length,

  // Roles
  roleDialog: document.querySelectorAll('[role="dialog"]').length,
  roleAlert: document.querySelectorAll('[role="alert"]').length,
  roleButton: document.querySelectorAll('[role="button"]').length,
  roleTablist: document.querySelectorAll('[role="tablist"]').length,

  // Images without alt
  imagesWithoutAlt: Array.from(document.querySelectorAll('img'))
    .filter(img => !img.hasAttribute('alt')).length,

  // Inputs without labels
  inputsWithoutLabels: Array.from(document.querySelectorAll('input, textarea, select'))
    .filter(i => !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby')
      && !document.querySelector(`label[for="${i.id}"]`)).length,
}
// All "Without" counts should be 0
```

---

## 9. Testing Checklist

### Keyboard Testing
- [ ] Tab through entire page — focus never gets stuck
- [ ] All interactive elements reachable via keyboard
- [ ] Focus indicator visible on every element
- [ ] Enter activates links and buttons
- [ ] Space activates buttons and checkboxes
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate within menus

### Screen Reader Testing
- [ ] Page structure announced (headings, landmarks)
- [ ] All images have meaningful alt text
- [ ] All form inputs have labels
- [ ] Dynamic content announced via aria-live
- [ ] Modals trap focus correctly
- [ ] Error messages announced

### Visual Testing
- [ ] Contrast ratio ≥ 4.5:1 for normal text
- [ ] Contrast ratio ≥ 3:1 for large text and UI components
- [ ] No information conveyed by color alone
- [ ] Text resizable to 200% without loss
- [ ] Content reflows at 320px width (no horizontal scroll)

---

## 10. Openlysts-Specific A11y Patterns

### Skip Link Implementation
```jsx
// In App.jsx or layout component
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
>
  Skip to main content
</a>
```

### Bookmark Button Accessibility
```jsx
<button
  onClick={toggleBookmark}
  aria-label={isBookmarked ? `Remove ${repo.name} from bookmarks` : `Add ${repo.name} to bookmarks`}
  aria-pressed={isBookmarked}
>
  <Bookmark className={isBookmarked ? 'fill-current' : ''} />
</button>
```

### Search Results Announcements
```jsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {searchResults.length > 0
    ? `${searchResults.length} results found`
    : 'No results found'}
</div>
```
