import { useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useLogoEasterEgg() {
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  const handleLogoClick = useCallback((e) => {
    clickCount.current += 1;

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    if (clickCount.current >= 5) {
      // Fire confetti
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { x, y },
        colors: ['#C9B3F5', '#FFCBDE', '#A08F7E', '#3a3a3a'],
        disableForReducedMotion: true
      });

      clickCount.current = 0;
    } else {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 400); // 400ms to click again
    }
  }, []);

  return handleLogoClick;
}
