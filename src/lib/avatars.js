// ─── Avatar System ───────────────────────────────────────────────────
// Single source of truth for the developer avatar archetypes. Profile.jsx
// and the header/drawer both render from these presets so a saved avatar
// actually shows up everywhere the user is identified.

import { Terminal, Cpu, Sparkles, Code2, Layers } from 'lucide-react';

export const AVATAR_PRESETS = [
  { id: 'cyber-green', name: 'Matrix Hacker', bg: 'from-emerald-500 to-teal-700', icon: Terminal, color: '#10B981' },
  { id: 'quantum-blue', name: 'Quantum Dev', bg: 'from-blue-600 to-indigo-800', icon: Cpu, color: '#3B82F6' },
  { id: 'neon-purple', name: 'Cyberpunk Architect', bg: 'from-purple-600 to-fuchsia-800', icon: Sparkles, color: '#A855F7' },
  { id: 'sunset-amber', name: 'OSS Curator', bg: 'from-amber-500 to-rose-700', icon: Code2, color: '#F59E0B' },
  { id: 'monochrome', name: 'Stealth Engineer', bg: 'from-zinc-700 to-zinc-950', icon: Layers, color: '#71717A' },
];

export function parseUserSettings(user) {
  try {
    const raw = user?.settings;
    return typeof raw === 'string' ? JSON.parse(raw) : raw || {};
  } catch {
    return {};
  }
}

/**
 * Resolve a user's display avatar.
 * @returns {{ type: 'url', url: string, preset: object } | { type: 'preset', preset: object, initial: string }}
 */
export function resolveAvatar(user) {
  const settings = parseUserSettings(user);
  const preset = AVATAR_PRESETS.find(p => p.id === settings.avatarPreset) || AVATAR_PRESETS[1];
  if (typeof settings.customAvatarUrl === 'string' && settings.customAvatarUrl.trim()) {
    return { type: 'url', url: settings.customAvatarUrl.trim(), preset };
  }
  return { type: 'preset', preset, initial: (user?.name || user?.email || 'U')[0].toUpperCase() };
}