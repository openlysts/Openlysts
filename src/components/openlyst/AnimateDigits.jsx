import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function SingleDigit({ digit }) {
  const num = parseInt(digit, 10);
  if (isNaN(num)) {
    return <span className="inline-block">{digit}</span>;
  }

  return (
    <div className="relative inline-block h-[1.2em] w-[0.65em] overflow-hidden align-middle">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: `-${num * 10}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="absolute top-0 left-0 w-full flex flex-col items-center"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div key={n} className="h-[1.2em] flex items-center justify-center font-mono">
            {n}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function AnimateDigits({ value, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value);
  // The 0-9 strip only exists for the scroll-in transition; once the spring
  // has settled the shown digit is static, so we drop the hidden strip to
  // keep long grids light (10+ hidden nodes per digit otherwise).
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setDisplayValue(value);
    setSettled(false);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 900);
    return () => clearTimeout(timer);
  }, [displayValue]);

  const digits = String(displayValue).split('');

  return (
    <span className={`inline-flex items-center font-bold tracking-tight ${className}`}>
      {settled ? (
        displayValue
      ) : (
        digits.map((d, index) => (
          <SingleDigit key={`${index}-${d}`} digit={d} />
        ))
      )}
    </span>
  );
}