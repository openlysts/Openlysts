---
name: responsive-mobile-first
description: "Responsive and mobile-first design skill for Openlysts. Covers breakpoint strategy, touch targets, responsive typography, mobile navigation, viewport-specific layouts, and cross-device testing."
---

# Responsive & Mobile-First Design Skill

## Role & Identity
Responsive Design Engineer ensuring Openlysts looks perfect on every device — from 375px phones to 2560px ultrawides.

## Core Principles
1. **Mobile-first** — design for smallest screen, add complexity up
2. **Touch-friendly** — all targets ≥ 44×44px (WCAG 2.5.5)
3. **No horizontal scroll** — content fits within viewport
4. **Readable text** — minimum 16px base, no pinching to read
5. **Progressive enhancement** — core content works everywhere

---

## 1. Breakpoint System (Tailwind CSS)

```javascript
// Tailwind default breakpoints (used in Openlysts)
screens: {
  'sm': '640px',    // Large phones
  'md': '768px',    // Tablets
  'lg': '1024px',   // Small laptops
  'xl': '1280px',   // Desktops
  '2xl': '1536px',  // Large screens
}
```

### Usage Pattern
```jsx
{/* Mobile: 1 col, Tablet: 2 col, Desktop: 3 col */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {repos.map(repo => <RepoCard key={repo.id} repo={repo} />)}
</div>

{/* Mobile: hidden, Desktop: visible */}
<nav className="hidden lg:flex items-center gap-6">
  {/* Desktop nav */}
</nav>

{/* Mobile: visible, Desktop: hidden */}
<button className="lg:hidden">
  {/* Hamburger menu */}
</button>
```

---

## 2. Mobile Navigation Pattern

```jsx
function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button - visible on mobile only */}
      <button
        className="lg:hidden p-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <Menu />
      </button>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-64 bg-background p-6">
            {/* Nav links */}
          </nav>
        </div>
      )}

      {/* Desktop nav - hidden on mobile */}
      <nav className="hidden lg:flex items-center gap-6">
        {/* Desktop nav links */}
      </nav>
    </>
  );
}
```

---

## 3. Touch Target Requirements

### WCAG 2.5.5: Minimum 44×44px
```jsx
// BAD: Too small
<button className="p-1">Click</button>  // 32×32px

// GOOD: Touch-friendly
<button className="p-3 min-h-[44px] min-w-[44px]">Click</button>

// GOOD: Using Tailwind's touch utilities
<button className="touch-manipulation p-3">Click</button>
```

### Audit Touch Targets
```javascript
// Run in browser console on mobile viewport
Array.from(document.querySelectorAll('a, button, [role="button"]'))
  .filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
  })
  .map(el => ({
    tag: el.tagName,
    text: el.textContent?.trim().substring(0, 30),
    w: Math.round(el.getBoundingClientRect().width),
    h: Math.round(el.getBoundingClientRect().height),
  }));
```

---

## 4. Responsive Typography

```css
/* Base: 16px, scales up on larger screens */
html {
  font-size: 16px;
}

@media (min-width: 768px) {
  html { font-size: 17px; }
}

@media (min-width: 1280px) {
  html { font-size: 18px; }
}
```

### Tailwind Responsive Text
```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Discover Open Source
</h1>

<p className="text-sm md:text-base text-muted-foreground">
  Description text
</p>
```

---

## 5. Responsive Grid Patterns

### Repository Grid
```jsx
{/* 1 col mobile → 2 col tablet → 3 col desktop → 4 col wide */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {repos.map(repo => <RepoCard key={repo.id} repo={repo} />)}
</div>
```

### Sidebar + Content Layout
```jsx
{/* Mobile: stacked, Desktop: side-by-side */}
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64 shrink-0">
    {/* Filters */}
  </aside>
  <main className="flex-1">
    {/* Content */}
  </main>
</div>
```

---

## 6. Mobile-Specific Patterns

### Bottom Sheet (Mobile)
```jsx
// Use vaul or Radix Dialog for mobile bottom sheets
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger asChild>
    <button className="lg:hidden">Open Filters</button>
  </Dialog.Trigger>
  <Dialog.Content className="fixed bottom-0 left-0 right-0 rounded-t-2xl p-6 lg:hidden">
    {/* Filter options */}
  </Dialog.Content>
</Dialog.Root>
```

### Pull-to-Refresh
```jsx
// For mobile bookmark/history lists
function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);

  return (
    <div
      onTouchStart={() => setPulling(true)}
      onTouchEnd={() => { setPulling(false); onRefresh(); }}
    >
      {pulling && <div className="text-center py-2">Pull to refresh</div>}
      {children}
    </div>
  );
}
```

### Safe Area Insets (Notch Devices)
```css
/* Add padding for devices with notch */
.safe-area-top { padding-top: env(safe-area-inset-top); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
```

---

## 7. Image Responsiveness

```jsx
// Responsive images with aspect ratio
<div className="aspect-video w-full">
  <img
    src={url}
    alt={alt}
    loading="lazy"
    decoding="async"
    className="w-full h-full object-cover"
  />
</div>

// Responsive avatar
<img
  src={avatar}
  alt={name}
  className="w-10 h-10 md:w-12 md:h-12 rounded-full"
  loading="lazy"
/>
```

---

## 8. Testing Protocol

### Viewport Matrix
| Viewport | Width × Height | Device |
|---|---|---|
| iPhone SE | 375 × 667 | Small phone |
| iPhone 14 | 390 × 844 | Standard phone |
| iPad | 768 × 1024 | Tablet portrait |
| iPad Pro | 1024 × 1366 | Tablet landscape |
| Laptop | 1280 × 720 | Small laptop |
| Desktop | 1920 × 1080 | Standard desktop |
| Ultrawide | 2560 × 1440 | Wide monitor |

### Automated Check
```bash
# Playwright responsive test
npx playwright test --grep "responsive"

# Manual browser resize
# Chrome DevTools → Toggle Device Toolbar → Select device
```

### Per-Breakpoint Checklist
- [ ] No horizontal scrollbar
- [ ] Text is readable without zooming
- [ ] Touch targets ≥ 44×44px
- [ ] Navigation is accessible (hamburger on mobile)
- [ ] Images don't overflow containers
- [ ] Forms are usable (inputs not too small)
- [ ] Modals/dialogs fit within viewport
- [ ] Tables scroll horizontally on mobile (or stack)

---

## 9. Common Responsive Issues in Openlysts

| Issue | Location | Fix |
|---|---|---|
| Horizontal overflow on mobile | Repo cards with long text | Add `overflow-hidden text-ellipsis` |
| Touch targets too small | Filter chips | Add `min-h-[44px] min-w-[44px]` |
| Modal too tall on mobile | Alternatives detail | Use bottom sheet on mobile |
| Table columns overlap | Admin tables | Horizontal scroll or stack on mobile |
| Image aspect ratio broken | Repo thumbnails | Wrap in `aspect-video` container |
| Font too small on mobile | Body text | Ensure 16px minimum |

---

## 10. Verification Checklist

Before any feature ships:
- [ ] Tested at 375px, 768px, 1280px viewports
- [ ] No horizontal scrollbar at any viewport
- [ ] All interactive elements ≥ 44×44px
- [ ] Text readable without zooming
- [ ] Navigation works on mobile (hamburger/drawer)
- [ ] Forms are usable on mobile (input sizes adequate)
- [ ] Images responsive (no overflow)
- [ ] Modals/dialogs fit mobile viewport
- [ ] Touch gestures don't conflict with scroll
- [ ] Safe area insets respected on notch devices
