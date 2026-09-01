# Accessibility Standards Rule

Every UI component in Openlysts MUST meet WCAG 2.1 Level AA. No exceptions.

---

## 1. Semantic HTML

### Required Landmarks
```html
<header role="banner">...</header>
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
<footer role="contentinfo">...</footer>
```

### Heading Hierarchy
- Exactly ONE `<h1>` per page
- Never skip heading levels (h1 → h3 is invalid)
- Use headings for structure, not styling

---

## 2. Keyboard Navigation

### Tab Order
- Skip link is first focusable element
- Logical flow: nav → content → footer
- Focus never gets stuck
- All interactive elements reachable

### Focus Styles
```css
:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}
```

### Required Keyboard Support
| Key | Action |
|---|---|
| Tab | Next focusable element |
| Shift+Tab | Previous focusable element |
| Enter | Activate links and buttons |
| Space | Activate buttons and checkboxes |
| Escape | Close modals, dropdowns |
| Arrow keys | Navigate menus, lists |

---

## 3. Images & Media

### Alt Text
```jsx
// Informative image
<img src="chart.png" alt="Star growth chart showing 1000 to 5000 stars" />

// Decorative image
<img src="decor.svg" alt="" role="presentation" />
```

### Rules
- Every `<img>` must have `alt` attribute
- Informative images: describe the content
- Decorative images: `alt=""` and `role="presentation"`
- Complex images: use `<figure>` + `<figcaption>`

---

## 4. Forms

### Labels
```jsx
// Every input must have a label
<label htmlFor="email">Email address</label>
<input id="email" type="email" aria-required="true" />

// Error messages must be associated
<input aria-invalid={hasError} aria-describedby="email-error" />
<p id="email-error" role="alert">Invalid email</p>
```

### Rules
- Every input has a visible label
- Error messages use `role="alert"`
- Required fields use `aria-required="true"`
- Fieldsets for radio/checkbox groups

---

## 5. ARIA Patterns

### Modals
```jsx
<Dialog.Content
  role="dialog"
  aria-modal="true"
  aria-labelledby="title"
>
  <h2 id="title">Dialog</h2>
</Dialog.Content>
```

### Dropdowns
```jsx
<button aria-expanded={isOpen} aria-haspopup="menu">Options</button>
```

### Live Regions
```jsx
<div aria-live="polite">{loadingMessage}</div>
<div aria-live="assertive" role="alert">{errorMessage}</div>
```

---

## 6. Color & Contrast

### Minimum Ratios
| Element | Normal Text | Large Text |
|---|---|---|
| Body text | 4.5:1 | 3:1 |
| UI components | 3:1 | 3:1 |
| Focus indicators | 3:1 | 3:1 |

### Rules
- Never rely on color alone for information
- Use icons + text for status indicators
- Test with color-blindness simulators

---

## 7. Touch Targets

### WCAG 2.5.5
- All interactive elements ≥ 44×44px
- Adequate spacing between targets

```jsx
<button className="min-h-[44px] min-w-[44px] p-3">Click</button>
```

---

## 8. Responsive

- Content reflows at 320px width (no horizontal scroll)
- Text resizable to 200% without loss
- No information lost at any viewport

---

## 9. Testing Checklist

### Keyboard
- [ ] Tab through entire page
- [ ] Focus visible on all elements
- [ ] Enter activates links/buttons
- [ ] Escape closes modals
- [ ] No keyboard traps

### Screen Reader
- [ ] Landmarks announced
- [ ] Headings in order
- [ ] Images have alt text
- [ ] Forms have labels
- [ ] Dynamic content announced

### Visual
- [ ] Contrast ≥ 4.5:1
- [ ] No color-only information
- [ ] Text resizable
- [ ] Focus indicators visible

---

## 10. Enforcement

- WCAG compliance required for all new components
- Accessibility audit required before major releases
- Screen reader testing for critical flows
- Keyboard testing for all interactive elements
