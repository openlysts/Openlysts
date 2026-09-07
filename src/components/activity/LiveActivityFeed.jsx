import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Target, CheckSquare, Bell, FileText,
  Search, BarChart3, HelpCircle, ArrowRight, Feather
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

// Green = completion/success | Orange = urgent/blocked | Purple = management/routine
const actionColors = {
  goal_analyzed:       '#C9B3F5',  // purple — planning
  tasks_generated:     '#2ECC8A',  // green — creation success
  task_assigned:       '#C9B3F5',  // purple — management
  ping_sent:           '#FF8077',  // orange-red — urgent/needs attention
  digest_created:      '#C9B3F5',  // purple — routine
  status_checked:      '#C9B3F5',  // purple — routine
  workload_balanced:   '#C9B3F5',  // purple — management
  clarification_asked: '#FF8077',  // orange-red — needs attention
};

const nextActions = [
  "Check in with team on blocked tasks",
  "Send daily digest to project lead",
  "Analyse task completion trends",
  "Review overdue deadlines",
  "Ping assignees with no recent updates",
];

export default function LiveActivityFeed({ activities, tasks, scrollable = false }) {
  const blockedTasks = tasks.filter(t => t.status === "blocked");
  const nextAction = blockedTasks.length > 0
    ? `Resolve blocker on "${blockedTasks[0].title}"`
    : nextActions[new Date().getHours() % nextActions.length];

  return (
    <div className="flex flex-col h-full min-h-0">
      <style>{`
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>

      {/* Combined card */}
      <motion.div
        className="neu-raised flex-1 min-h-0 flex flex-col"
        style={{ overflowX: 'hidden', overflowY: 'hidden' }}
        whileHover={{ y: -5, boxShadow: '-12px -12px 28px rgba(255,250,244,0.92), 12px 12px 32px rgba(160,143,126,0.44)', transition: { duration: 0.22, ease: 'easeOut' } }}
      >
        {/* Header — same hierarchy as Goals */}
        <div className="flex items-center justify-between" style={{ padding: '20px 18px 0 18px', flexShrink: 0, marginBottom: 14 }}>
          <div className="flex items-center gap-2">
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#2ECC8A', flexShrink: 0, animation: 'live-pulse 2s ease-in-out infinite' }} />
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e6e6e' }}>
              Agent Activity
            </p>
          </div>
          <Link
            to="/activity"
            className="flex items-center gap-1"
            style={{ fontSize: 12, fontWeight: 500, color: '#6e6e6e', textDecoration: 'none' }}
          >
            Full log <ArrowRight style={{ width: 12, height: 12, strokeWidth: 1.5 }} />
          </Link>
        </div>
        {/* Next planned action — inset section at top */}
        <div
          style={{
            margin: '14px 14px 0 14px',
            padding: '12px 14px',
            background: '#ebe7e2',
            boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
            borderRadius: 10,
            flexShrink: 0,
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#767676', marginBottom: 5 }}>
            Next Planned Action
          </p>
          <p style={{ fontSize: 13, fontWeight: 400, color: '#3a3a3a', lineHeight: 1.5 }}>{nextAction}</p>
        </div>



        {/* Event stream */}
        <div className="flex-1 min-h-0 overflow-y-auto" style={{ overflowX: 'hidden' }}>
          {activities.length === 0 && (
            <div className="py-14 text-center">
              <Feather style={{ width: 16, height: 16, color: '#767676', strokeWidth: 1.5, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: '#767676' }}>No activity yet. Create a goal to get started.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {activities.map((activity, index) => {
              const Icon = actionIcons[activity.action_type] || Target;
              const bgColor = actionColors[activity.action_type] || '#C9B3F5';

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.15 }}
                  className="flex items-start gap-3 transition-colors duration-150"
                  style={{
                    padding: '14px 18px',
                    borderBottom: index < activities.length - 1 ? '1px solid rgba(163,163,163,0.18)' : 'none',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ width: 30, height: 30, borderRadius: '50%', background: bgColor }}
                  >
                    <Icon style={{ width: 13, height: 13, strokeWidth: 1.5, color: '#2a2a2a' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#3a3a3a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activity.title}
                      </p>
                      <span style={{ fontSize: 11, color: '#767676', flexShrink: 0 }}>
                        {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                      </span>
                    </div>
                    {activity.description && (
                      <p style={{ fontSize: 12, color: '#6e6e6e', marginTop: 2, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {activity.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}