import React, { forwardRef, useMemo, useRef, useEffect, useCallback } from 'react';

/**
 * @typedef {Object} VariableProximityProps
 * @property {string} label
 * @property {string} [fromFontVariationSettings]
 * @property {string} [toFontVariationSettings]
 * @property {any} [containerRef]
 * @property {number} [radius]
 * @property {string} [falloff]
 * @property {string} [className]
 * @property {any} [onClick]
 * @property {React.CSSProperties} [style]
 */

/**
 * VariableProximity Component (React Bits - 60FPS Butter-Smooth Fluid Edition)
 * Zero-layout-thrashing proximity typography with smooth damping physics and fluid letter wave.
 * @type {React.ForwardRefExoticComponent<VariableProximityProps & React.RefAttributes<any>>}
 */
const VariableProximity = forwardRef((/** @type {any} */ props, ref) => {
  const {
    label,
    fromFontVariationSettings = "'wght' 400",
    toFontVariationSettings = "'wght' 900",
    containerRef,
    radius = 160,
    falloff = 'gaussian',
    className = '',
    onClick,
    style,
    ...restProps
  } = props;

  const letterRefs = useRef([]);
  const localContainerRef = useRef(null);
  const targetContainer = containerRef || localContainerRef;
  const positionsCache = useRef([]);
  const mousePos = useRef({ x: -9999, y: -9999, active: false });
  const isUpdating = useRef(false);

  // Extract min and max weights, plus any extra axes to preserve
  const parsedWeights = useMemo(() => {
    const fromMatch = fromFontVariationSettings.match(/'wght'\s*(\d+)/);
    const toMatch = toFontVariationSettings.match(/'wght'\s*(\d+)/);
    // Extract non-wght axes (e.g. "'opsz' 32") to preserve during interpolation
    const extraAxes = fromFontVariationSettings
      .split(',')
      .map(s => s.trim())
      .filter(s => !s.includes("'wght'"))
      .join(', ');
    return {
      min: fromMatch ? parseInt(fromMatch[1], 10) : 400,
      max: toMatch ? parseInt(toMatch[1], 10) : 900,
      extraAxes, // e.g. "'opsz' 32"
    };
  }, [fromFontVariationSettings, toFontVariationSettings]);

  // Split text into words and characters
  const words = useMemo(() => {
    return label.split(' ').map((word) => word.split(''));
  }, [label]);

  // Cache letter centers once to avoid layout thrashing in RAF loop
  const updateLetterPositions = useCallback(() => {
    positionsCache.current = letterRefs.current.map((el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + rect.height / 2 + window.scrollY,
      };
    });
  }, []);

  const calculateFalloff = useCallback((distance, maxRadius, type) => {
    const norm = Math.max(0, Math.min(1, 1 - distance / maxRadius));
    if (type === 'linear') return norm;
    if (type === 'exponential') return Math.pow(norm, 2);
    // Gaussian falloff for silky water-like ripple
    return Math.exp(-Math.pow(distance / (maxRadius * 0.45), 2));
  }, []);

  useEffect(() => {
    updateLetterPositions();
    window.addEventListener('resize', updateLetterPositions, { passive: true });
    window.addEventListener('scroll', updateLetterPositions, { passive: true });

    return () => {
      window.removeEventListener('resize', updateLetterPositions);
      window.removeEventListener('scroll', updateLetterPositions);
    };
  }, [updateLetterPositions, words]);

  useEffect(() => {
    let rafId;

    const render = () => {
      const { x, y, active } = mousePos.current;
      const pageX = x + window.scrollX;
      const pageY = y + window.scrollY;

      letterRefs.current.forEach((el, idx) => {
        if (!el) return;
        const pos = positionsCache.current[idx];

        if (!active || !pos) {
          el.style.fontVariationSettings = fromFontVariationSettings;
          el.style.fontWeight = parsedWeights.min;
          el.style.transform = 'translate3d(0, 0, 0)';
          return;
        }

        const distance = Math.hypot(pageX - pos.x, pageY - pos.y);

        if (distance < radius) {
          const intensity = calculateFalloff(distance, radius, falloff);
          const currentWeight = Math.round(
            parsedWeights.min + (parsedWeights.max - parsedWeights.min) * intensity
          );
          const lift = (-4 * intensity).toFixed(2);

          const extraPart = parsedWeights.extraAxes ? `, ${parsedWeights.extraAxes}` : '';
          el.style.fontVariationSettings = `'wght' ${currentWeight}${extraPart}`;
          el.style.fontWeight = currentWeight;
          el.style.transform = `translate3d(0, ${lift}px, 0)`;
        } else {
          el.style.fontVariationSettings = fromFontVariationSettings;
          el.style.fontWeight = parsedWeights.min;
          el.style.transform = 'translate3d(0, 0, 0)';
        }
      });

      if (mousePos.current.active) {
        rafId = requestAnimationFrame(render);
      } else {
        isUpdating.current = false;
      }
    };

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mousePos.current = { x: clientX, y: clientY, active: true };

      if (!isUpdating.current) {
        isUpdating.current = true;
        rafId = requestAnimationFrame(render);
      }
    };

    const handlePointerLeave = () => {
      mousePos.current = { x: -9999, y: -9999, active: false };
      if (!isUpdating.current) {
        isUpdating.current = true;
        rafId = requestAnimationFrame(render);
      }
    };

    const container = targetContainer.current;
    if (container) {
      container.addEventListener('pointermove', handlePointerMove, { passive: true });
      container.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    } else {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerleave', handlePointerLeave);
      } else {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerleave', handlePointerLeave);
      }
      cancelAnimationFrame(rafId);
    };
  }, [targetContainer, radius, falloff, parsedWeights, fromFontVariationSettings, calculateFalloff]);

  let letterIndex = 0;

  return (
    <span
      ref={ref || localContainerRef}
      className={`inline-block cursor-default select-none ${className}`}
      onClick={onClick}
      style={style}
      {...restProps}
    >
      {words.map((word, wIdx) => (
        <span key={`word-${wIdx}`} className="inline-block whitespace-nowrap">
          {word.map((char, cIdx) => {
            const currentIndex = letterIndex++;
            return (
              <span
                key={`char-${wIdx}-${cIdx}`}
                ref={(el) => (letterRefs.current[currentIndex] = el)}
                className="inline-block will-change-transform will-change-[font-variation-settings] transition-[transform,font-variation-settings,font-weight] duration-150 ease-out"
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
