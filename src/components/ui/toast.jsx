import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  KeyRound,
  Trash2,
  Sparkles,
  X,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Variant configurations for 3D styling & animations
const VARIANT_CONFIGS = {
  default: {
    icon: Sparkles,
    iconColor: "text-accent",
    glowColor: "rgba(59, 130, 246, 0.25)",
    borderClass: "border-accent/30 bg-bg-card/95",
    progressClass: "bg-accent",
    ambientLight: "from-accent/15 via-transparent to-transparent",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    glowColor: "rgba(16, 185, 129, 0.25)",
    borderClass: "border-emerald-500/30 bg-bg-card/95",
    progressClass: "bg-emerald-400",
    ambientLight: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  delete: {
    icon: Trash2,
    iconColor: "text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.3)",
    borderClass: "border-red-500/30 bg-bg-card/95",
    progressClass: "bg-gradient-to-r from-red-500 to-amber-500",
    ambientLight: "from-red-500/25 via-amber-500/10 to-transparent",
  },
  security: {
    icon: KeyRound,
    iconColor: "text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.28)",
    borderClass: "border-purple-500/30 bg-bg-card/95",
    progressClass: "bg-purple-400",
    ambientLight: "from-purple-500/25 via-fuchsia-500/10 to-transparent",
  },
  destructive: {
    icon: AlertTriangle,
    iconColor: "text-rose-400",
    glowColor: "rgba(244, 63, 94, 0.3)",
    borderClass: "border-rose-500/40 bg-bg-card/95",
    progressClass: "bg-rose-500",
    ambientLight: "from-rose-500/25 via-rose-500/10 to-transparent",
  },
  error: {
    icon: XCircle,
    iconColor: "text-rose-400",
    glowColor: "rgba(244, 63, 94, 0.3)",
    borderClass: "border-rose-500/40 bg-bg-card/95",
    progressClass: "bg-rose-500",
    ambientLight: "from-rose-500/25 via-rose-500/10 to-transparent",
  },
  info: {
    icon: Info,
    iconColor: "text-cyan-400",
    glowColor: "rgba(6, 182, 212, 0.25)",
    borderClass: "border-cyan-500/30 bg-bg-card/95",
    progressClass: "bg-cyan-400",
    ambientLight: "from-cyan-500/20 via-cyan-500/5 to-transparent",
  },
};

export const Toast3D = React.forwardRef(function Toast3D(
  {
    id,
    title,
    description,
    variant = "default",
    action,
    duration = 4500,
    onDismiss,
  },
  ref
) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.default;
  const Icon = config.icon;
  const remainingTimeRef = useRef(duration);

  // Countdown timer with pause/resume on hover
  useEffect(() => {
    if (isPaused) return;

    const interval = 25;
    const timer = setInterval(() => {
      remainingTimeRef.current -= interval;
      const pct = Math.max(0, (remainingTimeRef.current / duration) * 100);
      setProgress(pct);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timer);
        onDismiss?.(id);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, duration, id, onDismiss]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // macOS-style delete crumple & vacuum exit physics
  const isDelete = variant === "delete";
  const exitAnimation = isDelete
    ? {
        scale: [1, 0.85, 0.3],
        rotateZ: [0, -8, 15],
        rotateX: [0, 20, 60],
        y: [0, -10, -40],
        opacity: [1, 0.8, 0],
        filter: "blur(4px)",
        transition: { duration: 0.45, ease: [0.36, 0, 0.66, -0.56] },
      }
    : {
        opacity: 0,
        y: -20,
        scale: 0.9,
        rotateX: -15,
        transition: { duration: 0.28, ease: "easeOut" },
      };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.88,
        rotateX: 18,
        rotateY: -4,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        transition: {
          type: "spring",
          stiffness: 420,
          damping: 26,
          mass: 0.8,
        },
      }}
      exit={exitAnimation}
      drag="x"
      dragConstraints={{ left: 0, right: 200 }}
      dragElastic={0.4}
      onDragEnd={(e, info) => {
        if (info.offset.x > 80 || info.velocity.x > 300) {
          onDismiss?.(id);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "pointer-events-auto relative w-full max-w-[390px] select-none rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl transition-shadow",
        "shadow-black/50 hover:shadow-accent/20",
        config.borderClass
      )}
      style={{
        boxShadow: `0 14px 40px -10px ${config.glowColor}, 0 2px 10px rgba(0,0,0,0.5)`,
        transformPerspective: 1000,
      }}
    >
      {/* Ambient glass glow shimmer */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50 transition-opacity",
          config.ambientLight
        )}
      />

      {/* Top light reflection line */}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative flex items-start gap-3.5">
        {/* Dynamic 3D Icon Container with pulsing ring */}
        <div className="relative flex-shrink-0 pt-0.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-subtle/80 border border-white/10 shadow-inner"
            style={{
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.15), 0 0 12px ${config.glowColor}`,
            }}
          >
            <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", config.iconColor)} />
          </div>
          {isDelete && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500/40"
            >
              <Flame className="h-2 w-2 text-amber-300" />
            </motion.span>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-6">
          {title && (
            <h4 className="text-xs font-bold text-text tracking-tight flex items-center gap-1.5">
              <span>{title}</span>
            </h4>
          )}
          {description && (
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-text-secondary line-clamp-2">
              {description}
            </p>
          )}
          {action && <div className="mt-2">{action}</div>}
        </div>

        {/* Close Button with micro-rotation on hover */}
        <button
          onClick={() => onDismiss?.(id)}
          className="absolute right-2 top-2 p-1 rounded-lg text-text-muted hover:text-text hover:bg-bg-subtle/80 transition-all hover:rotate-90"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Dynamic 3D Countdown Progress Bar */}
      <div className="absolute inset-x-3 bottom-0 h-[2.5px] overflow-hidden rounded-full bg-bg-subtle/60">
        <motion.div
          className={cn("h-full rounded-full transition-all", config.progressClass)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
});

// Fallback exports for backward compatibility
export const ToastProvider = ({ children }) => <>{children}</>;
export const ToastViewport = () => null;
export const Toast = Toast3D;
export const ToastTitle = ({ children, className }) => <span className={className}>{children}</span>;
export const ToastDescription = ({ children, className }) => <p className={className}>{children}</p>;
export const ToastClose = () => null;
export const ToastAction = ({ children, className }) => <div className={className}>{children}</div>;