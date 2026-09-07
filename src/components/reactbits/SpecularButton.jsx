import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function SpecularButton({
  children,
  onClick,
  highlight = '#ffffff',
  edge = '#525252',
  tint = '#ffffff',
  textColor = '#f5f5f5',
  radius = '49px',
  tintOpacity = 0,
  blur = 0,
  intensity = 1.55,
  thickness = 1.8,
  proximity = 400,
  className = '',
  ...props
}) {
  const buttonRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        borderRadius: radius,
        backgroundColor: 'transparent',
        color: textColor,
        boxShadow: blur > 0 ? `0 0 ${blur}px rgba(0,0,0,0.5)` : 'none',
      }}
      className={`relative overflow-hidden px-8 py-3 font-medium flex items-center justify-center transition-all group ${className}`}
      {...props}
    >
      {/* Base Inner Background - slight dark tint to separate from page bg */}
      <div
        className="absolute inset-[1px] bg-black/60 pointer-events-none"
        style={{ borderRadius: `calc(${radius} - 1px)` }}
      />

      {/* Base Edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          border: `${thickness}px solid ${edge}`,
        }}
      />
      
      {/* Specular Highlight on the Edge */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          borderRadius: radius,
          border: `${thickness}px solid ${highlight}`,
          opacity: isHovered ? intensity : 0,
          maskImage: `radial-gradient(${proximity}px circle at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(${proximity}px circle at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
        }}
      />

      {/* Tint inside the button */}
      {tintOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            borderRadius: radius,
            background: `radial-gradient(${proximity}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${tint}, transparent 100%)`,
            opacity: isHovered ? tintOpacity : 0,
          }}
        />
      )}

      {/* Text/Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
