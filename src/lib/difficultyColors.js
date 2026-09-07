// 500-level text colors fail WCAG 1.4.3 (≈2.3:1) on their 10% tinted pills in
// light mode. 600-level clears 4.5:1 on light; index.css swaps these to *-300
// tints under [data-theme="dark"] (Tailwind `dark:` variants can't express the
// app's data-theme scheme).
export function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'Beginner':
      return 'text-green-600 border-green-500/20 bg-green-500/10';
    case 'Intermediate':
      return 'text-orange-600 border-orange-500/20 bg-orange-500/10';
    case 'Pro':
      return 'text-red-600 border-red-500/20 bg-red-500/10';
    default:
      return 'text-slate-600 border-slate-500/20 bg-slate-500/10';
  }
}
