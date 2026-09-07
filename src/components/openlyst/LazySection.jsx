import { useEffect, useRef, useState } from 'react';

/**
 * LazySection — defers rendering of below-the-fold content until it is
 * scrolled near the viewport (IntersectionObserver). Cuts initial DOM
 * size and paints for long pages; children mount once and stay mounted.
 */
export default function LazySection({
  children,
  className = '',
  minHeight = 120,
  rootMargin = '600px',
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={inView ? undefined : { minHeight }}
    >
      {inView ? children : null}
    </div>
  );
}