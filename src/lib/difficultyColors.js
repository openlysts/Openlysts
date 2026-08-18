export function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'Beginner':
      return 'text-green-600 border-green-200 bg-green-50/50 dark:text-green-400 dark:border-green-900/50 dark:bg-green-900/20';
    case 'Intermediate':
      return 'text-yellow-600 border-yellow-200 bg-yellow-50/50 dark:text-yellow-400 dark:border-yellow-900/50 dark:bg-yellow-900/20';
    case 'Pro':
      return 'text-red-600 border-red-200 bg-red-50/50 dark:text-red-400 dark:border-red-900/50 dark:bg-red-900/20';
    default:
      return 'text-gray-600 border-gray-200 bg-gray-50/50 dark:text-gray-400 dark:border-gray-800/50 dark:bg-gray-800/20';
  }
}
