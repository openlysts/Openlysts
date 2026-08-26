import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Generates an array of random particles for the explosion
const generateParticles = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    angle: Math.random() * Math.PI * 2,
    velocity: 20 + Math.random() * 40,
    size: 4 + Math.random() * 6,
    color: ['#F43F5E', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'][Math.floor(Math.random() * 5)],
  }));
};

export default function ParticleExplosion({ active, children, particleCount = 12 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (active) {
      setParticles(generateParticles(particleCount));
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [active, particleCount]);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* The main child (e.g. the Heart button) */}
      <motion.div
        animate={active ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative z-10"
      >
        {children}
      </motion.div>

      {/* The Explosion Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
            animate={{
              opacity: 0,
              x: Math.cos(p.angle) * p.velocity,
              y: Math.sin(p.angle) * p.velocity,
              scale: 1.5
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none z-0"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
