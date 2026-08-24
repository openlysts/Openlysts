---
name: react-bits
description: Implement high-quality animated React components from the React Bits library for premium frontend design in Openlysts.
---

# React Bits Skill

## Objective
When the user asks to add UI animations, text effects, or engaging backgrounds to Openlysts, utilize the **React Bits** library (DavidHDev/react-bits).

## Usage Guidelines
1. **Search & Selection**: React Bits has 165+ free components. If a specific effect is requested (e.g., "blur text reveal", "particle background"), look it up at https://reactbits.dev/.
2. **Implementation**: 
   - Follow the eactbits.dev installation instructions for the specific component.
   - Typically involves copying a specific .jsx or .tsx file into the src/components/ directory.
   - Ensure you install any required dependencies (like ramer-motion or lucide-react) if the component requires them.
3. **Styling Integration**: React Bits components often use Tailwind or raw CSS. Openlysts uses raw CSS/Vanilla CSS (avoid Tailwind unless specified). If a component provides Tailwind classes, convert them to Vanilla CSS for Openlysts to maintain the design system, OR if Tailwind is already installed and preferred for that component, use it carefully without breaking index.css.
4. **Wow Factor**: Use these components strategically to create the premium, dynamic aesthetic required by Openlysts' global design directives. Do not overuse animations; they should feel intentional.
