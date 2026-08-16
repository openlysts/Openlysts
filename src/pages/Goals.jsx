import React, { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, X } from "lucide-react";
import GoalCard from "../components/goals/GoalCard";
import GoalCreationWizard from "../components/goals/GoalCreationWizard";

const FILTERS = ["all", "active", "completed", "draft", "paused"];
const FILTER_LABELS = { all: "All", active: "Active", completed: "Done", draft: "Draft", paused: "Paused" };

export default function Goals() {
  const [showWizard, setShowWizard] = useState(false);
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") setShowWizard(true);
  }, []);

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => localClient.entities.Goal.list("-created_date", 50),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => localClient.entities.Task.list("-created_date", 200),
  });
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team"],
    queryFn: () => localClient.entities.User.list(),
  });

  const filteredGoals = filter === "all" ? goals : goals.filter(g => g.status === filter);
  const countFor = (s) => s === "all" ? goals.length : goals.filter(g => g.status === s).length;

  const handleDeleteGoal = async (goalId) => {
    await localClient.entities.Task.deleteMany({ goal_id: goalId });
    await localClient.entities.Goal.delete(goalId);
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="page-container" style={{ padding: '24px 28px', boxSizing: 'border-box', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4 }}>
            Goals
          </h1>
          <p style={{ fontSize: 14, color: '#6e6e6e' }}>Manage your team objectives</p>
        </div>
        {/* New Goal button — top-right on mobile */}
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 btn-neu"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 18px', color: '#3a3a3a', flexShrink: 0, marginLeft: 12 }}
        >
          <Plus style={{ width: 12, height: 12, strokeWidth: 2 }} />
          <span className="hidden sm:inline">New Goal</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* New Goal Modal */}
      {showWizard && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(46,42,38,0.30)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px',
          }}
          onClick={() => setShowWizard(false)}
        >
          <div
            style={{
              background: '#eeeae6',
              borderRadius: 24,
              padding: '28px 28px 24px',
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* X close button */}
            <button
              onClick={() => setShowWizard(false)}
              style={{
                position: 'absolute', top: 18, right: 18,
                width: 32, height: 32, borderRadius: 9,
                background: '#ebe7e2',
                boxShadow: '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.28)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#5a5a5a',
                transition: 'box-shadow 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '-6px -6px 12px rgba(255,250,244,0.9), 6px 6px 14px rgba(160,143,126,0.36)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.28)'; }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
            <GoalCreationWizard
              teamMembers={teamMembers}
              onComplete={() => {
                setShowWizard(false);
                queryClient.invalidateQueries({ queryKey: ["goals"] });
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
                queryClient.invalidateQueries({ queryKey: ["activities"] });
              }}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}

      <>
          {/* Filter chips — horizontal scroll on mobile */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 20, marginLeft: -2, marginRight: -2, paddingBottom: 4 }}>
            <div style={{ display: 'flex', gap: 8, padding: '2px 2px', width: 'max-content' }}>
              {FILTERS.map(f => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      padding: '7px 14px',
                      borderRadius: 9999,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      color: active ? '#3a3a3a' : '#6e6e6e',
                      background: active ? '#ebe7e2' : 'transparent',
                      boxShadow: active
                        ? 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)'
                        : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {FILTER_LABELS[f]} <span style={{ opacity: 0.6, fontSize: 11 }}>({countFor(f)})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal list */}
          {filteredGoals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} tasks={tasks} onDelete={handleDeleteGoal} onEdit={() => queryClient.invalidateQueries({ queryKey: ["goals"] })} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: 60 }}>
              <Target style={{ width: 28, height: 28, color: '#b3b3b3', strokeWidth: 1.5, marginBottom: 14 }} />
              <p style={{ fontSize: 15, color: '#3a3a3a', fontWeight: 400, marginBottom: 6 }}>No goals yet</p>
              <p style={{ fontSize: 13, color: '#767676', marginBottom: 20, textAlign: 'center' }}>Create your first goal and let AI plan the work.</p>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 btn-neu"
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 18px', color: '#3a3a3a' }}
              >
                <Plus style={{ width: 12, height: 12, strokeWidth: 2 }} />
                Create Goal
              </button>
            </div>
          )}
      </>
    </div>
  );
}