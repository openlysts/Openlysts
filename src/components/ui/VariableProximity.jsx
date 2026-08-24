import React, { forwardRef, useMemo, useRef, useEffect, useCallback } from 'react';

/**
 * VariableProximity Component (React Bits)
 * Dynamically interpolates font weight, scale, vertical float lift, and luminescence based on cursor proximity.
 */
const VariableProximity = forwardRef((props, ref) => {
  const {
    label,
    fromFontVariationSettings = "'wght' 300",
    toFontVariationSettings = "'wght' 900",
    containerRef,
    radius = 160,
    falloff = 'gaussian',
    className = '',
    onClick,
    style,
    ...rest
  } = props;

  const letterRefs = useRef([]);
  const localContainerRef = useRef(null);

  // Extract min and max weights
  const parsedWeights = useMemo(() => {
    const fromMatch = fromFontVariationSettings.match(/'wght'\s*(\d+)/);
    const toMatch = toFontVariationSettings.match(/'wght'\s*(\d+)/);
    return {
      min: fromMatch ? parseInt(fromMatch[1], 10) : 300,
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
    return Math.exp(-Math.pow(distance / (maxRadius * 0.42), 2));
  }, []);

  useEffect(() => {
    let mouseX = -9999;
    let mouseY = -9999;
    let isMoving = false;
    let animationFrameId;

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouseX = clientX;
      mouseY = clientY;
      isMoving = true;
    };

    const handlePointerLeave = () => {
      isMoving = false;
      mouseX = -9999;
      mouseY = -9999;
    };

    const updateLetterPhysics = () => {
      letterRefs.current.forEach((letterEl) => {
        if (!letterEl) return;

        if (!isMoving || mouseX < 0) {
          letterEl.style.fontWeight = parsedWeights.min;
          letterEl.style.transform = 'translate3d(0, 0, 0) scale(1)';
          letterEl.style.fontVariationSettings = `'wght' ${parsedWeights.min}`;
          letterEl.style.textShadow = 'none';
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
          const currentScale = 1 + 0.16 * intensity;
          const currentLift = -5 * intensity;

          letterEl.style.fontWeight = currentWeight;
          letterEl.style.transform = `translate3d(0, ${currentLift}px, 0) scale(${currentScale})`;
          letterEl.style.fontVariationSettings = `'wght' ${currentWeight}`;
          if (intensity > 0.35) {
            letterEl.style.textShadow = `0 0 16px hsl(var(--accent) / ${(intensity * 0.6).toFixed(2)})`;
          } else {
            letterEl.style.textShadow = 'none';
          }
        } else {
          letterEl.style.fontWeight = parsedWeights.min;
          letterEl.style.transform = 'translate3d(0, 0, 0) scale(1)';
          letterEl.style.fontVariationSettings = `'wght' ${parsedWeights.min}`;
          letterEl.style.textShadow = 'none';
        }
      });

      if (isMoving) {
        animationFrameId = requestAnimationFrame(updateLetterPhysics);
      }
    };

    const onPointerMove = (e) => {
      handlePointerMove(e);
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateLetterPhysics);
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [radius, falloff, parsedWeights, calculateFalloff]);

  let letterIndex = 0;

  return (
    <span
      ref={ref || localContainerRef}
      className={`inline-block cursor-default select-none transition-colors ${className}`}
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
