import React from "react";
import { Calendar, Clock, User, Zap } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { motion } from "framer-motion";

const statusDot = {
  done:        '#2ECC8A',
  in_progress: '#C9B3F5',
  blocked:     '#FF8077',
  need_help:   '#FF8077',
  pending:     '#C9B3F5',
};

const statusLabels = {
  done:        'Done',
  in_progress: 'In Progress',
  blocked:     'Blocked',
  need_help:   'Need Help',
  pending:     'Pending',
};

export default function TaskCard({ task, onClick }) {
  const isOverdue  = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done";
  const isDueToday = task.deadline && isToday(new Date(task.deadline));
  const isBlocked  = task.status === "blocked";

  return (
    <motion.div
      className="cursor-pointer"
      style={{
        background: '#eeeae6',
        boxShadow: isBlocked
          ? '-5px -5px 10px rgba(255,250,244,0.92), 5px 5px 12px rgba(160,143,126,0.36), inset 0 0 0 1px rgba(255,128,119,0.18)'
          : '-5px -5px 10px rgba(255,250,244,0.92), 5px 5px 12px rgba(160,143,126,0.36)',
        borderRadius: 14,
        padding: '14px 18px',
      }}
      onClick={() => onClick?.(task)}
      whileHover={{
        y: -5,
        boxShadow: '-12px -12px 28px rgba(255,250,244,0.92), 12px 12px 32px rgba(160,143,126,0.44)',
        transition: { duration: 0.22, ease: 'easeOut' },
      }}
    >
      {/* Status row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: statusDot[task.status] || '#A1A1AA' }}
        />
        <span           style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e' }}>
          {statusLabels[task.status] || task.status}
        </span>
        {task.created_by_ai && (
          <span
            className="flex items-center gap-0.5"
            style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '0.05em',
              color: '#996CE4', border: '1px solid rgba(160,143,126,0.2)',
              borderRadius: 6, padding: '1px 5px', background: '#eeeae6',
            }}
          >
            <Zap style={{ width: 9, height: 9, strokeWidth: 1.5 }} /> AI
          </span>
        )}
      </div>

      <h4 style={{ fontSize: 14, fontWeight: 500,               color: isBlocked ? '#BD3228' : '#3a3a3a', marginBottom: 4, lineHeight: 1.3 }}>
        {task.title}
      </h4>

      {task.description && (
        <p style={{ fontSize: 12, color: '#6B6B72', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
          {task.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 mt-2.5">
        {task.assignee_name && (
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: '#6e6e6e' }}>
            <User style={{ width: 11, height: 11, strokeWidth: 1.5 }} />
            <span>{task.assignee_name}</span>
          </div>
        )}
        {task.deadline && (
          <div className="flex items-center gap-1"           style={{ fontSize: 11, color: isOverdue ? '#BD3228' : isDueToday ? '#BD3228' : '#6e6e6e', fontWeight: isOverdue || isDueToday ? 500 : 400 }}>
            <Calendar style={{ width: 11, height: 11, strokeWidth: 1.5 }} />
            <span>{isOverdue ? 'Overdue · ' : isDueToday ? 'Today · ' : ''}{format(new Date(task.deadline), 'MMM d')}</span>
          </div>
        )}
        {task.estimated_hours && (
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: '#6e6e6e' }}>
            <Clock style={{ width: 11, height: 11, strokeWidth: 1.5 }} />
            <span>{task.estimated_hours}h</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}