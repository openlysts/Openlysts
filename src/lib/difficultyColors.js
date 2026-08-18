export function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'Beginner':
      return 'text-green-500 border-green-500/20 bg-green-500/10';
    case 'Intermediate':
      return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
    case 'Pro':
      return 'text-red-500 border-red-500/20 bg-red-500/10';
    default:
      return 'text-slate-500 border-slate-500/20 bg-slate-500/10';
  }
}
