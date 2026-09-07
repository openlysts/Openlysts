import React from "react";
import { Bot } from "lucide-react";
import { motion } from "framer-motion";

export default function AiAvatar({ size = "sm" }) {
  const sizes = { xs: 24, sm: 32, md: 40, lg: 48 };
  const iconSizes = { xs: 12, sm: 16, md: 20, lg: 24 };
  const px = sizes[size];
  const ix = iconSizes[size];

  return (
    <motion.div
      style={{
        width: px, height: px, borderRadius: '50%', flexShrink: 0,
        background: '#eeeae6',
        boxShadow: '-4px -4px 8px rgba(255,250,244,0.88), 4px 4px 10px rgba(160,143,126,0.32)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}
      animate={{ boxShadow: [
        '-4px -4px 8px rgba(255,250,244,0.88), 4px 4px 10px rgba(160,143,126,0.32)',
        '-4px -4px 12px rgba(201,179,245,0.55), 4px 4px 14px rgba(160,143,126,0.28)',
        '-4px -4px 8px rgba(255,250,244,0.88), 4px 4px 10px rgba(160,143,126,0.32)',
      ]}}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
      >
        <Bot style={{ width: ix, height: ix, color: '#7c6fa0', strokeWidth: 1.6 }} />
      </motion.div>
    </motion.div>
  );
}