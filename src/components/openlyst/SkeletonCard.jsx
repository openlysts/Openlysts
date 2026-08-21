import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <div className="card relative overflow-hidden p-4 h-[210px] flex flex-col border border-border/40 bg-bg-card/40 backdrop-blur-sm" aria-hidden="true">
      <motion.div
        className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-[-20deg]"
        animate={{ x: ['-100%', '50%'] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
      />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bg-subtle/60" />
          <div className="space-y-2">
            <div className="w-28 h-4 bg-bg-subtle/60 rounded-md" />
            <div className="w-20 h-3 bg-bg-subtle/40 rounded-md" />
          </div>
        </div>
        <div className="w-7 h-7 rounded-lg bg-bg-subtle/60" />
      </div>
      <div className="space-y-3 mt-2">
        <div className="w-full h-3 bg-bg-subtle/50 rounded-md" />
        <div className="w-11/12 h-3 bg-bg-subtle/50 rounded-md" />
        <div className="w-4/5 h-3 bg-bg-subtle/50 rounded-md" />
      </div>
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/30">
        <div className="w-16 h-4 bg-bg-subtle/60 rounded-md" />
        <div className="flex gap-2">
          <div className="w-14 h-5 bg-bg-subtle/60 rounded-md" />
          <div className="w-14 h-5 bg-bg-subtle/60 rounded-md" />
        </div>
      </div>
    </div>
  );
}
