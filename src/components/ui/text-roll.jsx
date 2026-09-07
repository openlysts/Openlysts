import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function TextRoll({
  children,
  className,
  duration = 0.5,
  stagger = 0.05,
  once = false
}) {
  if (typeof children !== 'string') {
    return <span className={className}>{children}</span>;
  }

  const characters = children.split('');

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: stagger,
      }
    }
  };

  const childVariants = {
    initial: { y: '100%', opacity: 0, rotateX: -90 },
    animate: { 
      y: '0%', 
      opacity: 1, 
      rotateX: 0,
      transition: {
        duration,
        ease: [0.25, 1, 0.5, 1]
      }
    }
  };

  return (
    <motion.span 
      className="inline-block overflow-hidden relative"
      initial="initial"
      whileInView="animate"
      viewport={{ once, amount: 'some' }}
    >
      <span className="sr-only">{children}</span>
      <span className="inline-block" aria-hidden="true">
        {characters.map((char, i) => (
          <motion.span
            key={i}
            variants={childVariants}
            className={cn("inline-block", className)}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </span>
    </motion.span>
  );
}
