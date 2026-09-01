---
name: uiverse-galaxy
description: "Guidelines and implementation recipes for sourcing, adapting, and integrating 3,000+ open-source CSS/HTML/Tailwind UI elements from Uiverse.io (github.com/uiverse-io/galaxy) into Openlysts."
---

# Uiverse Galaxy UI Elements Skill

## Objective
When the user asks to add micro-interactions, futuristic buttons, custom loaders, glowing cards, input fields, checkboxes, or toggles, leverage the **Uiverse Galaxy** ecosystem (`https://github.com/uiverse-io/galaxy` / `https://uiverse.io/`).

---

## 1. Catalog & Component Archetypes
Uiverse provides raw CSS/HTML and Tailwind snippets across core categories:
- **Buttons**: Neomorphic, glowing neon, cyber border, glassmorphism, ripple, and sliding gradient triggers.
- **Cards**: Holographic foil, tilt-responsive 3D depth, border-beam, radar, and ambient backglow cards.
- **Loaders**: Quantum spinners, wave pulses, orbital rings, and skeletal loaders.
- **Inputs / Forms**: Floating label animations, search bars with expanding lens triggers, OTP inputs.
- **Switches & Checkboxes**: Skeuomorphic flips, day/night toggles, morphing SVG indicators.
- **Patterns & Badges**: Animated dotted matrices, scanlines, and animated gradient badges.

---

## 2. Adaptation Protocol for Openlysts

When lifting components from Uiverse:

### A. Theme Harmonization (Dark Mode & Palette Alignment)
- Standardize colors to Openlysts dark theme tokens:
  - Backgrounds: `#09090b` (zinc-950), `#121215`, `#18181b` (zinc-900).
  - Borders: `#27272a` (zinc-800) with subtle alpha hover highlights (`rgba(255,255,255,0.08)`).
  - Accents: Openlysts cyan/indigo/emerald/violet primary highlights (`#38bdf8`, `#6366f1`, `#10b981`, `#a855f7`).
  - Text: `#fafafa` (primary), `#a1a1aa` (muted), `#71717a` (subtle).

### B. Accessibility & React Compliance
1. **Semantic Elements**: Convert raw `<div>` buttons into real `<button>` elements with `type="button"|"submit"`.
2. **Keyboard Navigation**: Ensure `:focus-visible` outlines or focus rings remain accessible (`outline-none ring-2 ring-primary/50`).
3. **React Attributes**: Replace `class=` with `className=`, inline styles with camelCase objects or CSS modules/Tailwind utilities.
4. **ARIA Labels**: Supply `aria-label` or `aria-checked` to icon-only buttons or custom switch widgets.

### C. Performance & Zero-Jank Rules
- Use hardware-accelerated CSS properties only for continuous animations: `transform` and `opacity`.
- Avoid animating `width`, `height`, `margin`, `top`, or `filter: blur()` on continuous loops to preserve 60FPS.
- Use CSS `@keyframes` with `will-change: transform` sparingly and clean them up when components unmount.

---

## 3. Reference Implementation Pattern

```jsx
// Example: Converting a Uiverse Neon Glass Card into a React Component
import React from 'react';
import { cn } from '@/lib/utils';

export function UiverseNeonCard({ title, description, badge, className, children }) {
  return (
    <div
      className={cn(
        "relative group overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.15)]",
        className
      )}
    >
      {/* Ambient gradient hover sweep */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent" 
        aria-hidden="true" 
      />
      
      {badge && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800/80 text-cyan-400 border border-zinc-700/50 mb-3">
          {badge}
        </span>
      )}
      
      {title && <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">{title}</h3>}
      {description && <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{description}</p>}
      
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
```
