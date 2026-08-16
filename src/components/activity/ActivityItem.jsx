import React from "react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Target, CheckSquare, Bell, FileText,
  Search, BarChart3, HelpCircle
} from "lucide-react";

const actionIcons = {
  goal_analyzed:       Target,
  tasks_generated:     CheckSquare,
  task_assigned:       CheckSquare,
  ping_sent:           Bell,
  digest_created:      FileText,
  status_checked:      Search,
  workload_balanced:   BarChart3,
  clarification_asked: HelpCircle,
};

// Flat colored circles — same palette as LiveActivityFeed on Dashboard
const iconColors = {
  goal_analyzed:       '#C9B3F5',
  tasks_generated:     '#2ECC8A',
  task_assigned:       '#C9B3F5',
  ping_sent:           '#FF7043',
  digest_created:      '#C9B3F5',
  status_checked:      '#C9B3F5',
  workload_balanced:   '#C9B3F5',
  clarification_asked: '#FF7043',
};

export default function ActivityItem({ activity, index, isLast }) {
  const Icon = actionIcons[activity.action_type] || Target;
  const bgColor = iconColors[activity.action_type] || '#C9B3F5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 18px',
        borderBottom: isLast ? 'none' : '1px solid rgba(160,143,126,0.15)',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Flat colored circle — matches Dashboard style */}
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        flexShrink: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
      }}>
        <Icon style={{ width: 13, height: 13, color: '#2a2a2a', strokeWidth: 1.5 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#3a3a3a' }}>{activity.title}</p>
          <span style={{ fontSize: 11, color: '#767676', flexShrink: 0 }}>
            {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
          </span>
        </div>
        {activity.description && (
          <p style={{ fontSize: 12, color: '#6e6e6e', lineHeight: 1.5 }}>{activity.description}</p>
        )}
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b3b3b3', display: 'block', marginTop: 4 }}>
          {activity.action_type.replace(/_/g, " ")}
        </span>
      </div>
    </motion.div>
  );
}