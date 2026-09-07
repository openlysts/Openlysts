import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STATES = [
  {
    color: "#996CE4",
    // triangle / pyramid
    dots: [
      { x:  0,    y: -1.0 },
      { x: -0.5,  y:  0.0 },
      { x:  0.5,  y:  0.0 },
      { x: -1.0,  y:  1.0 },
      { x:  0,    y:  1.0 },
      { x:  1.0,  y:  1.0 },
    ],
  },
  {
    color: "#996CE4",
    // hexagon / circle
    dots: [
      { x:  0,     y: -1   },
      { x:  0.866, y: -0.5 },
      { x:  0.866, y:  0.5 },
      { x:  0,     y:  1   },
      { x: -0.866, y:  0.5 },
      { x: -0.866, y: -0.5 },
    ],
  },
  {
    color: "#996CE4",
    // diamond
    dots: [
      { x:  0,    y: -1   },
      { x: -0.75, y: -0.3 },
      { x:  0.75, y: -0.3 },
      { x: -0.75, y:  0.3 },
      { x:  0.75, y:  0.3 },
      { x:  0,    y:  1   },
    ],
  },
  {
    color: "#996CE4",
    // cross / plus
    dots: [
      { x:  0, y: -1 },
      { x:  0, y:  1 },
      { x: -1, y:  0 },
      { x:  1, y:  0 },
      { x:  0, y:  0 },
      { x:  0, y:  0 },
    ],
  },
];

export default function LogoIcon({ size = 12 }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % STATES.length), 2400);
    return () => clearInterval(interval);
  }, []);

  const current = STATES[step % STATES.length];
  const { color, dots } = current;
  const spread = size * 0.62;
  const dotSize = size * 0.32;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {dots.map((pos, i) => (
        <motion.div
          key={i}
          animate={{
            x: pos.x * spread,
            y: pos.y * spread,
            backgroundColor: color,
          }}
          transition={{
            duration: 0.55,
            delay: i * 0.04,
            ease: [0.34, 1.2, 0.64, 1],
          }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: color,
            marginTop: -dotSize / 2,
            marginLeft: -dotSize / 2,
          }}
        />
      ))}
    </div>
  );
}