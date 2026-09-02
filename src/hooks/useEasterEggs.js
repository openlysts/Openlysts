import { useState, useEffect } from 'react';

// Konami Code sequence: up, up, down, down, left, right, left, right, B, A
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a'
];

export function useEasterEggs() {
  const [konamiActive, setKonamiActive] = useState(false);
  const [matrixActive, setMatrixActive] = useState(false);

  useEffect(() => {
    let konamiIndex = 0;
    let matrixBuffer = '';
    const matrixKeyword = 'matrix';

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // Check Konami Code
      if (e.key.toLowerCase() === KONAMI_CODE[konamiIndex].toLowerCase()) {
        konamiIndex++;
        if (konamiIndex === KONAMI_CODE.length) {
          setKonamiActive(true);
          const root = document.getElementById('root');
          if (root) root.classList.add('konami-active');
          konamiIndex = 0;
          setTimeout(() => {
            setKonamiActive(false);
            if (root) root.classList.remove('konami-active');
          }, 5000); // Disable after 5s
        }
      } else {
        konamiIndex = 0;
      }

      // Check Matrix Keyword
      if (e.key.length === 1) { // Only printable chars
        matrixBuffer += e.key.toLowerCase();
        if (matrixBuffer.length > matrixKeyword.length) {
          matrixBuffer = matrixBuffer.slice(1);
        }
        if (matrixBuffer === matrixKeyword) {
          setMatrixActive(true);
          matrixBuffer = '';
          setTimeout(() => setMatrixActive(false), 10000); // Disable after 10s
        }
      } else if (e.key === 'Backspace') {
        matrixBuffer = matrixBuffer.slice(0, -1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { konamiActive, matrixActive };
}
