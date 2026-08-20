import { useState, useEffect, useRef } from 'react';

export function useLiveCounter(initialValue, minIncrement = 1, maxIncrement = 3, minInterval = 3000, maxInterval = 8000) {
  const [value, setValue] = useState(initialValue);
  const valueRef = useRef(initialValue);

  // Update if initialValue jumps significantly (e.g. successful real fetch)
  useEffect(() => {
    if (typeof initialValue === 'number' && initialValue > valueRef.current) {
      setValue(initialValue);
      valueRef.current = initialValue;
    }
  }, [initialValue]);

  useEffect(() => {
    if (typeof initialValue !== 'number') return;
    
    let timeoutId;
    const tick = () => {
      const interval = Math.random() * (maxInterval - minInterval) + minInterval;
      timeoutId = setTimeout(() => {
        const increment = Math.floor(Math.random() * (maxIncrement - minIncrement + 1)) + minIncrement;
        setValue(prev => {
          const next = prev + increment;
          valueRef.current = next;
          return next;
        });
        tick();
      }, interval);
    };
    
    tick();
    
    return () => clearTimeout(timeoutId);
  }, [minIncrement, maxIncrement, minInterval, maxInterval, initialValue]);

  return value;
}
