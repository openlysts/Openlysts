import React, { useState } from "react";
import { localClient } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import TaskCard from "../components/tasks/TaskCard";

const FILTERS = [
  { key: "all",         label: "All"         },
  { key: "pending",     label: "Pending"     },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked",     label: "Blocked"     },
  { key: "done",        label: "Done"        },
];

export default function Tasks() {
  const [filter, setFilter] = useState("all");

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-all"],
    queryFn: () => localClient.entities.Task.list("-created_date", 500),
  });

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const countFor = (key) => key === "all" ? tasks.length : tasks.filter(t => t.status === key).length;

  return (
    <div className="page-container" style={{ padding: '24px 28px', boxSizing: 'border-box', height: '100%', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4 }}>
          Tasks
        </h1>
        <p style={{ fontSize: 14, color: '#6e6e6e' }}>{tasks.length} total tasks across all goals</p>
      </div>

      {/* Filter chips */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 20, marginLeft: -2, marginRight: -2, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 8, padding: '2px 2px', width: 'max-content' }}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
                padding: '7px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
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
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80 }}>
          <CheckSquare style={{ width: 28, height: 28, color: '#b3b3b3', strokeWidth: 1.5, marginBottom: 14 }} />
          <p style={{ fontSize: 15, color: '#3a3a3a', fontWeight: 400, marginBottom: 6 }}>
            {filter === "all" ? "No tasks yet" : `No ${filter.replace("_", " ")} tasks`}
          </p>
          <p style={{ fontSize: 13, color: '#767676' }}>Tasks are created when goals are set up.</p>
        </div>
      )}
    </div>
  );
}