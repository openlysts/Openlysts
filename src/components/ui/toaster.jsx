import React from "react";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Toast3D } from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col items-end gap-3 p-2 sm:top-6 sm:right-6 max-h-screen overflow-hidden"
      style={{ perspective: 1200 }}
    >
      <AnimatePresence mode="popLayout">
        {toasts
          .filter((t) => t.open !== false)
          .map((t) => (
            <Toast3D
              key={t.id}
              id={t.id}
              title={t.title}
              description={t.description}
              variant={t.variant}
              action={t.action}
              duration={t.duration || 4500}
              onDismiss={dismiss}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}