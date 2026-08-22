import React from 'react';
import { useEasterEggs } from '@/hooks/useEasterEggs';
import MatrixRain from '@/components/reactbits/MatrixRain';

export default function EasterEggsOverlay() {
  const { konamiActive, matrixActive } = useEasterEggs();

  return (
    <>
      {matrixActive && <MatrixRain />}
    </>
  );
}

console.log('EasterEggsOverlay file loaded');
