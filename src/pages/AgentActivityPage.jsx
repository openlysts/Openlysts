import React from "react";
import { motion } from "framer-motion";
import { localClient } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { Activity, Search } from "lucide-react";
import ActivityItem from "../components/activity/ActivityItem";

export default function AgentActivityPage() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities-all"],
    queryFn: () => localClient.entities.AgentActivity.list("-created_date", 100),
    refetchInterval: 15000,
  });

  const grouped = activities.reduce((acc, activity) => {
    const date = new Date(activity.created_date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  return (
    <div className="page-container" style={{ padding: '24px 28px', boxSizing: 'border-box', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4 }}>
            Agent Activity
          </h1>
          <p style={{ fontSize: 14, color: '#6e6e6e' }}>Full transparency — every action the agent takes</p>
        </div>
        {/* Online badge */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '7px 12px', borderRadius: 9999,
            background: '#ebe7e2',
            boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2ECC8A', flexShrink: 0, display: 'inline-block', animation: 'live-pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#3a3a3a', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Online</span>
          {activities.length > 0 && (
            <span style={{ fontSize: 11, color: '#767676' }}>· {activities.length}</span>
          )}
        </div>
      </div>

      {/* Last action banner */}
      <div
        className="mb-6"
        style={{
          padding: '14px 18px',
          borderRadius: 14,
          background: '#eeeae6',
          boxShadow: '-5px -5px 10px rgba(255,250,244,0.92), 5px 5px 12px rgba(160,143,126,0.36)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: activities.length > 0
            ? { goal_analyzed: '#C9B3F5', tasks_generated: '#2ECC8A', task_assigned: '#C9B3F5', ping_sent: '#FF7043', digest_created: '#C9B3F5', status_checked: '#C9B3F5', workload_balanced: '#C9B3F5', clarification_asked: '#FF7043' }[activities[0]?.action_type] || '#C9B3F5'
            : '#C9B3F5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Search style={{ width: 16, height: 16, color: '#2a2a2a', strokeWidth: 1.5 }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#3a3a3a', marginBottom: 2 }}>
            {activities.length > 0 ? activities[0].title : "Waiting for goals..."}
          </p>
          <p style={{ fontSize: 12, color: '#767676' }}>
            {activities.length > 0 ? "Last agent action" : "Create a goal to activate the agent"}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div style={{ width: 20, height: 20, border: '2px solid rgba(160,143,126,0.3)', borderTopColor: '#996CE4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : activities.length > 0 ? (
        <div className="flex flex-col gap-5">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#767676' }}>{date}</span>
              </div>
              <motion.div
                style={{
                  background: '#eeeae6',
                  borderRadius: 14,
                  boxShadow: '-5px -5px 10px rgba(255,250,244,0.92), 5px 5px 12px rgba(160,143,126,0.36)',
                  overflow: 'hidden',
                }}
                whileHover={{
                  y: -5,
                  boxShadow: '-12px -12px 28px rgba(255,250,244,0.92), 12px 12px 32px rgba(160,143,126,0.44)',
                  transition: { duration: 0.22, ease: 'easeOut' },
                }}
              >
                {items.map((a, i) => (
                  <ActivityItem key={a.id} activity={a} index={i} isLast={i === items.length - 1} />
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80 }}>
          <Activity style={{ width: 28, height: 28, color: '#b3b3b3', strokeWidth: 1.5, marginBottom: 14 }} />
          <p style={{ fontSize: 15, color: '#3a3a3a', fontWeight: 400, marginBottom: 6 }}>No activity yet</p>
          <p style={{ fontSize: 13, color: '#767676' }}>Create your first goal and the agent will start working.</p>
        </div>
      )}
    </div>
  );
}