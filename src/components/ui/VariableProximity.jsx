import React, { forwardRef, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * VariableProximity Component (React Bits)
 * Dynamically interpolates font weight, scale, and subtle glow based on cursor proximity.
 */
const VariableProximity = forwardRef((props, ref) => {
  const {
    label,
    fromFontVariationSettings = "'wght' 400",
    toFontVariationSettings = "'wght' 900",
    containerRef,
    radius = 120,
    falloff = 'gaussian',
    className = '',
    onClick,
    style,
    ...rest
  } = props;

  const letterRefs = useRef([]);
  const localContainerRef = useRef(null);
  const targetContainer = containerRef || localContainerRef;

  // Extract min and max weight from font variation settings if provided
  const parsedWeights = useMemo(() => {
    const fromMatch = fromFontVariationSettings.match(/'wght'\s*(\d+)/);
    const toMatch = toFontVariationSettings.match(/'wght'\s*(\d+)/);
    return {
      min: fromMatch ? parseInt(fromMatch[1], 10) : 400,
      max: toMatch ? parseInt(toMatch[1], 10) : 900,
    };
  }, [fromFontVariationSettings, toFontVariationSettings]);

  // Split text into words and characters
  const words = useMemo(() => {
    return label.split(' ').map((word) => word.split(''));
  }, [label]);

  const calculateFalloff = useCallback((distance, maxRadius, type) => {
    const norm = Math.max(0, Math.min(1, 1 - distance / maxRadius));
    if (type === 'linear') return norm;
    if (type === 'exponential') return Math.pow(norm, 2);
    // Gaussian falloff
    return Math.exp(-Math.pow(distance / (maxRadius * 0.5), 2));
  }, []);

  useEffect(() => {
    const container = targetContainer.current;
    if (!container) return;

    let mouseX = -9999;
    let mouseY = -9999;
    let isHovering = false;
    let animationFrameId;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    const updateLetterWeights = () => {
      letterRefs.current.forEach((letterEl) => {
        if (!letterEl) return;

        if (!isHovering) {
          letterEl.style.fontWeight = parsedWeights.min;
          letterEl.style.transform = 'scale(1)';
          letterEl.style.fontVariationSettings = fromFontVariationSettings;
          return;
        }

        const rect = letterEl.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2;
        const letterCenterY = rect.top + rect.height / 2;

        const distance = Math.hypot(mouseX - letterCenterX, mouseY - letterCenterY);

        if (distance < radius) {
          const intensity = calculateFalloff(distance, radius, falloff);
          const currentWeight = Math.round(
            parsedWeights.min + (parsedWeights.max - parsedWeights.min) * intensity
          );
          const currentScale = 1 + 0.08 * intensity;

          letterEl.style.fontWeight = currentWeight;
          letterEl.style.transform = `scale(${currentScale})`;
          letterEl.style.fontVariationSettings = `'wght' ${currentWeight}`;
        } else {
          letterEl.style.fontWeight = parsedWeights.min;
          letterEl.style.transform = 'scale(1)';
          letterEl.style.fontVariationSettings = fromFontVariationSettings;
        }
      });

      if (isHovering) {
        animationFrameId = requestAnimationFrame(updateLetterWeights);
      }
    };

    const onMove = (e) => {
      handleMouseMove(e);
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateLetterWeights);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetContainer, radius, falloff, parsedWeights, fromFontVariationSettings, calculateFalloff]);

  let letterIndex = 0;

  return (
    <span
      ref={ref || localContainerRef}
      className={`inline-block cursor-default select-none ${className}`}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {words.map((word, wIdx) => (
        <span key={`word-${wIdx}`} className="inline-block whitespace-nowrap">
          {word.map((char, cIdx) => {
            const currentIndex = letterIndex++;
            return (
              <span
                key={`char-${wIdx}-${cIdx}`}
                ref={(el) => (letterRefs.current[currentIndex] = el)}
                className="inline-block transition-transform duration-75 origin-bottom will-change-transform"
                style={{
                  fontVariationSettings: fromFontVariationSettings,
                  fontWeight: parsedWeights.min,
                }}
              >
                {char}
              </span>
            );
          })}
          {wIdx < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
});

VariableProximity.displayName = 'VariableProximity';

export default VariableProximity;
