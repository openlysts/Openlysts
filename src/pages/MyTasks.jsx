import React, { useState, useMemo } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckSquare, Bell } from "lucide-react";
import TaskCard from "../components/tasks/TaskCard";
import StatusUpdateForm from "../components/tasks/StatusUpdateForm";

function TaskCardWithNote({ task, note, onClick }) {
  const [noteOpen, setNoteOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <TaskCard task={task} onClick={onClick} />
      {note && (
        <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 2 }}>
          {!noteOpen ? (
            <button
              onClick={e => { e.stopPropagation(); setNoteOpen(true); }}
              style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
                padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: '#ebe7e2',
                boxShadow: '-2px -2px 5px rgba(255,250,244,0.78), 2px 2px 5px rgba(160,143,126,0.24)',
                color: '#6e6e6e',
              }}
            >
              Note
            </button>
          ) : (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: 260, background: '#eeeae6',
                boxShadow: '-4px -4px 8px rgba(255,250,244,0.78), 4px 4px 10px rgba(160,143,126,0.28)',
                borderRadius: 10, padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6e6e6e' }}>Note</span>
                <button
                  onClick={() => setNoteOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9a9a', fontSize: 14, lineHeight: 1, padding: 0 }}
                >×</button>
              </div>
              <p style={{ fontSize: 12, color: '#3a3a3a', lineHeight: 1.5, margin: 0 }}>{note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FILTERS = [
  { key: "all",         label: "All"         },
  { key: "pending",     label: "Pending"     },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked",     label: "Blocked"     },
  { key: "done",        label: "Done"        },
];

export default function MyTasks() {
  const [filter, setFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => localClient.auth.me(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      const res = await localClient.functions.invoke('getMyTasks', {});
      return res.data?.tasks || [];
    },
    enabled: !!user,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["my-task-updates", user?.id],
    queryFn: () => localClient.entities.Update.list('-created_date', 500),
    enabled: !!user,
  });

  // Latest note per task
  const latestNoteByTask = React.useMemo(() => {
    const map = {};
    updates.forEach(u => {
      if (u.message && !map[u.task_id]) map[u.task_id] = u.message;
    });
    return map;
  }, [updates]);

  const { data: pings = [] } = useQuery({
    queryKey: ["my-pings", user?.id],
    queryFn: () => localClient.entities.Ping.filter({ assignee_id: user?.id, status: "sent" }),
    enabled: !!user?.id,
  });

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const countFor = (key) => key === "all" ? tasks.length : tasks.filter(t => t.status === key).length;

  return (
    <div className="page-container" style={{ padding: '24px 28px', boxSizing: 'border-box', height: '100%', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4 }}>
          My Tasks
        </h1>
        <p style={{ fontSize: 14, color: '#6e6e6e' }}>{tasks.length} tasks assigned to you</p>
      </div>

      {/* Pending Pings */}
      {pings.length > 0 && (
        <div
          className="mb-5"
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: '#ebe7e2',
            boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF7043', flexShrink: 0, display: 'inline-block', animation: 'live-pulse 2s ease-in-out infinite' }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#3a3a3a', marginBottom: 2 }}>
              {pings.length} pending check-in{pings.length > 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: 12, color: '#6e6e6e' }}>Click on a task below to post your status update</p>
          </div>
        </div>
      )}

      {/* Filter chips — horizontal scroll on mobile */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 20, marginLeft: -2, marginRight: -2, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 8, padding: '2px 2px', width: 'max-content' }}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                padding: '7px 14px',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: filter === key ? '#3a3a3a' : '#6e6e6e',
                background: filter === key ? '#ebe7e2' : 'transparent',
                boxShadow: filter === key
                  ? 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {label} <span style={{ opacity: 0.6, fontSize: 11 }}>({countFor(key)})</span>
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredTasks.map(task => (
            <TaskCardWithNote key={task.id} task={task} note={latestNoteByTask[task.id]} onClick={setSelectedTask} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80 }}>
          <CheckSquare style={{ width: 28, height: 28, color: '#b3b3b3', strokeWidth: 1.5, marginBottom: 14 }} />
          <p style={{ fontSize: 15, color: '#3a3a3a', fontWeight: 400, marginBottom: 6 }}>
            {filter === "all" ? "No tasks assigned" : `No ${filter.replace("_", " ")} tasks`}
          </p>
          <p style={{ fontSize: 13, color: '#767676' }}>Tasks will show up here once goals are created and assigned.</p>
        </div>
      )}

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-md" style={{ background: '#eeeae6', borderRadius: 16, border: 'none', boxShadow: 'none' }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 16, fontWeight: 500, color: '#3a3a3a' }}>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              {selectedTask.goal_title && (
                <p style={{ fontSize: 12, color: '#767676' }}>Goal: {selectedTask.goal_title}</p>
              )}
              {selectedTask.description && (
                <p style={{ fontSize: 13, color: '#6e6e6e' }}>{selectedTask.description}</p>
              )}
              <div style={{ borderTop: '1px solid rgba(160,143,126,0.2)', paddingTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', marginBottom: 12 }}>Post Status Update</p>
                <StatusUpdateForm
                  task={selectedTask}
                  user={user}
                  onSubmit={() => {
                    setSelectedTask(null);
                    queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
                    queryClient.invalidateQueries({ queryKey: ["my-task-updates", user?.id] });
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}