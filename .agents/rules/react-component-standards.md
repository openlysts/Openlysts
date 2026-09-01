# React Component Standards Rule

Every React component in Openlysts MUST follow these standards. No exceptions.

---

## 1. File Structure

### Component File Template
```jsx
// src/components/openlyst/RepoCard.jsx

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

// Types (JSDoc or PropTypes)
/**
 * @param {{ repo: object, onBookmark: function }} props
 */
export default function RepoCard({ repo, onBookmark }) {
  // Hooks first
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  // Callbacks
  const handleBookmark = useCallback(() => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(repo.id);
  }, [isBookmarked, repo.id, onBookmark]);

  // Early returns
  if (!repo) return null;

  // Render
  return (
    <div className="...">
      {/* Content */}
    </div>
  );
}
```

---

## 2. Component Rules

### File Organization
```
1. Imports (external → internal → utils → types)
2. Component declaration (named function, not arrow)
3. Hooks (useState, useEffect, useCallback, useMemo)
4. Handlers (event handlers, callbacks)
5. Early returns (loading, error, empty states)
6. JSX return
```

### Naming
- Files: `PascalCase.jsx` (e.g., `RepoCard.jsx`)
- Components: `PascalCase` (e.g., `RepoCard`)
- Export: `export default function RepoCard()` (named function, not anonymous arrow)

### Never
- Anonymous arrow components: `const Card = () => {}` ❌
- Inline component definitions inside render ❌
- Conditional rendering of entire component trees with && (use ternary) ❌

---

## 3. Hooks Rules

### Rules of Hooks
1. Only call hooks at the top level (never in loops, conditions, or nested functions)
2. Only call hooks from React functions (components or custom hooks)
3. Custom hooks must start with `use` (e.g., `useBookmark`)

### useState
```jsx
// GOOD: Descriptive names
const [isBookmarked, setIsBookmarked] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [isLoading, setIsLoading] = useState(false);

// BAD: Generic names
const [flag, setFlag] = useState(false);
const [data, setData] = useState(null);
```

### useEffect
```jsx
// GOOD: Dependency array is complete
useEffect(() => {
  fetchRepos(query);
}, [query]); // query is in deps

// BAD: Missing dependency
useEffect(() => {
  fetchRepos(query);
}, []); // query is missing!

// Cleanup function for subscriptions
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### useCallback / useMemo
```jsx
// Memoize expensive computations
const sortedRepos = useMemo(() => {
  return repos.sort((a, b) => b.stars - a.stars);
}, [repos]);

// Memoize callbacks passed to child components
const handleBookmark = useCallback((repoId) => {
  toggleBookmark(repoId);
}, []);
```

---

## 4. State Management

### Local State (preferred for UI state)
```jsx
const [isOpen, setIsOpen] = useState(false);
const [activeTab, setActiveTab] = useState('repos');
```

### React Query (for server state)
```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['repos'],
  queryFn: () => fetchRepos(),
  staleTime: 5 * 60 * 1000,
});

// Mutate data
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (newBookmark) => addBookmark(newBookmark),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  },
});
```

### Rules
- Use React Query for server data (not useState + useEffect)
- Use useState for UI state (modals, tabs, form inputs)
- Never store server data in useState (causes stale data)
- Always provide loading/error/empty states

---

## 5. Error Handling

### Error Boundaries
```jsx
// Wrap routes in error boundaries
<ErrorBoundary fallback={<ErrorPage />}>
  <Routes>
    <Route path="/discover" element={<DiscoverPage />} />
  </Routes>
</ErrorBoundary>
```

### Component Error Handling
```jsx
function RepoCard({ repo }) {
  if (!repo) return null;  // Early return

  return (
    <div>
      <img src={repo.thumbnail} alt={repo.name} onError={(e) => {
        e.target.src = '/placeholder.png';  // Fallback image
      }} />
    </div>
  );
}
```

---

## 6. Performance

### Code Splitting
```jsx
// Lazy load heavy components
const ThreeBackground = React.lazy(() => import('./ThreeBackground'));
const MarkdownViewer = React.lazy(() => import('./MarkdownViewer'));

// With Suspense
<Suspense fallback={<div>Loading...</div>}>
  <ThreeBackground />
</Suspense>
```

### Avoid Re-renders
```jsx
// React.memo for expensive components
const RepoCard = React.memo(function RepoCard({ repo, onBookmark }) {
  return <div>{/* ... */}</div>;
});

// Stable references for callbacks
const handleClick = useCallback(() => { /* ... */ }, [dependency]);
```

### Virtual Scrolling
```jsx
// For 100+ items
import { FixedSizeList } from 'react-window';

<FixedSizeList height={600} itemCount={repos.length} itemSize={120} width="100%">
  {({ index, style }) => <RepoCard repo={repos[index]} style={style} />}
</FixedSizeList>
```

---

## 7. Accessibility

### Required
- All images have `alt` text
- All buttons have accessible labels
- All form inputs have labels
- Modals trap focus
- Keyboard navigation works
- Focus indicators visible

```jsx
// GOOD: Accessible button
<button
  aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
  aria-pressed={isBookmarked}
  onClick={handleBookmark}
>
  <BookmarkIcon />
</button>
```

---

## 8. Styling

### Tailwind Only
```jsx
// GOOD: Tailwind utilities
<div className="flex items-center gap-2 p-4 rounded-lg bg-card">

// BAD: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>

// BAD: CSS modules (not used in this project)
<div className={styles.card}>
```

### Responsive Classes
```jsx
// Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Dark Mode
```jsx
// Use CSS variables (theme system)
<div className="bg-background text-foreground">
```

---

## 9. Forbidden Patterns

```jsx
// NEVER: String refs
<input ref="myInput" />  // BAD

// NEVER: findDOMNode
findDOMNode(this)  // BAD

// NEVER: Unsafe lifecycle methods
componentWillMount()  // BAD
componentWillReceiveProps()  // BAD

// NEVER: Direct DOM manipulation
document.getElementById('x').innerHTML = 'y'  // BAD

// NEVER: Inline function in JSX (causes re-render)
<button onClick={() => doSomething(id)}>  // BAD (unless memoized)
```

---

## Enforcement

- ESLint with react-hooks plugin enforces hook rules
- `npm run lint` must pass before commit
- Code review must verify accessibility
