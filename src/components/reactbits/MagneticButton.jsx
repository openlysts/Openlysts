import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function MagneticButton({
  children,
  className = "",
  magneticPull = 0.5,
  springOptions = { type: "spring", stiffness: 150, damping: 15, mass: 0.1 },
  onClick,
}) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const x = (clientX - centerX) * magneticPull;
    const y = (clientY - centerY) * magneticPull;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const x = useSpring(hovered ? position.x : 0, springOptions);
  const y = useSpring(hovered ? position.y : 0, springOptions);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      animate={{ x: hovered ? position.x : 0, y: hovered ? position.y : 0 }}
      transition={springOptions}
      className={`inline-block cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
}
