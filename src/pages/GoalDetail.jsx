import React, { useState } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, CheckCircle2, Target, Trash2, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import StatusUpdateForm from "../components/tasks/StatusUpdateForm";
import TaskCard from "../components/tasks/TaskCard";
import TaskFormModal from "../components/tasks/TaskFormModal";

const STATUS_COLORS = {
  active: '#2ECC8A',
  completed: '#C9B3F5',
  draft: '#b3b3b3',
  paused: '#FF7043',
};

const STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  draft: 'Draft',
  paused: 'Paused',
};

export default function GoalDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);

  const { data: goal } = useQuery({
    queryKey: ["goal", id],
    queryFn: async () => {
      const goals = await localClient.entities.Goal.filter({ id });
      return goals[0];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["goal-tasks", id],
    queryFn: () => localClient.entities.Task.filter({ goal_id: id }),
  });

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => localClient.auth.me(),
  });

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#b3b3b3', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const doneTasks = tasks.filter(t => t.status === "done").length;
  const blockedTasks = tasks.filter(t => t.status === "blocked").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const handleMarkComplete = async () => {
    await localClient.entities.Goal.update(goal.id, { status: "completed" });
    queryClient.invalidateQueries({ queryKey: ["goal", id] });
  };

  const handleDelete = async () => {
    setDeleting(true);
    await localClient.entities.Task.deleteMany({ goal_id: id });
    await localClient.entities.Goal.delete(id);
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    navigate("/goals");
  };

  const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  const refreshTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["goal-tasks", id] });
    queryClient.invalidateQueries({ queryKey: ["goal", id] });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  };

  const handleDeleteTask = async (taskId) => {
    await localClient.entities.Task.delete(taskId);
    setConfirmDeleteTask(null);
    refreshTasks();
  };

  return (
    <div style={{ padding: '24px 28px', boxSizing: 'border-box', height: '100%', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

      {/* Back link */}
      <Link
        to="/goals"
        className="inline-flex items-center gap-1.5 mb-6"
        style={{ fontSize: 13, color: '#6e6e6e', textDecoration: 'none', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#3a3a3a'}
        onMouseLeave={e => e.currentTarget.style.color = '#6e6e6e'}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Back to Goals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {/* Status pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: STATUS_COLORS[goal.status] || '#b3b3b3',
              flexShrink: 0, display: 'inline-block',
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e6e6e' }}>
              {STATUS_LABELS[goal.status] || goal.status}
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 6 }}>
            {goal.title}
          </h1>
          {goal.description && (
            <p style={{ fontSize: 14, color: '#6e6e6e', maxWidth: 560 }}>{goal.description}</p>
          )}
          {goal.target_date && (
            <div className="flex items-center gap-1.5 mt-2" style={{ color: '#767676', fontSize: 13 }}>
              <Calendar style={{ width: 13, height: 13 }} />
              <span>Target: {format(new Date(goal.target_date), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {goal.status === "active" && progress === 100 && (
            <button
              className="btn-neu flex items-center gap-2"
              onClick={handleMarkComplete}
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '11px 20px', color: '#3a3a3a' }}
            >
              <CheckCircle2 style={{ width: 13, height: 13, strokeWidth: 2 }} />
              Mark Complete
            </button>
          )}
          {!confirmDelete ? (
            <button
              className="btn-neu flex items-center gap-2"
              onClick={() => setConfirmDelete(true)}
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '11px 16px', color: '#BD3228' }}
            >
              <Trash2 style={{ width: 13, height: 13, strokeWidth: 2 }} />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, color: '#6e6e6e' }}>Delete goal & all tasks?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#BD3228', color: '#fff', fontSize: 12, fontWeight: 600,
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-neu"
                style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, color: '#6e6e6e' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats + Progress row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Progress card */}
        <div className="neu-raised" style={{ padding: '20px 24px', gridColumn: '1 / 3' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e6e6e' }}>Progress</p>
            <span style={{ fontSize: 13, color: '#6e6e6e' }}>{doneTasks}/{tasks.length} tasks done</span>
          </div>
          {/* Progress track */}
          <div className="progress-track" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.5s ease' }} />
          </div>
          <p style={{ fontSize: 24, fontWeight: 400, color: '#3a3a3a', marginTop: 12, letterSpacing: '-0.02em' }}>{progress}%</p>
        </div>

        {/* Quick stats */}
        <div className="neu-raised flex flex-col justify-center items-center" style={{ padding: '20px 16px', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e6e6e', marginBottom: 6 }}>Blocked</p>
            <div style={{
              width: 64, height: 64, borderRadius: 12, background: '#ebe7e2', margin: '0 auto',
              boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 26, fontWeight: 400, color: blockedTasks > 0 ? '#FF7043' : '#3a3a3a', letterSpacing: '-0.02em' }}>{blockedTasks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks section */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e6e6e' }}>Tasks</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#6e6e6e' }}>{tasks.length} total</span>
          <button
            onClick={() => setShowAddTask(true)}
            className="btn-neu flex items-center gap-1.5"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 14px', color: '#3a3a3a' }}
          >
            <Plus style={{ width: 12, height: 12, strokeWidth: 2 }} />
            Add Task
          </button>
        </div>
      </div>

      {sortedTasks.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sortedTasks.map(task => (
            <div key={task.id} style={{ position: 'relative' }}>
              <TaskCard task={task} onClick={setSelectedTask} />
              {/* Edit / Delete controls */}
              <div style={{ position: 'absolute', top: 10, right: 12, display: 'flex', gap: 2, zIndex: 2 }}>
                {confirmDeleteTask === task.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eeeae6', borderRadius: 8, padding: '3px 6px' }} onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: 11, color: '#6e6e6e' }}>Delete?</span>
                    <button onClick={() => handleDeleteTask(task.id)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#BD3228', color: '#fff', fontSize: 11, fontWeight: 600 }}>Yes</button>
                    <button onClick={() => setConfirmDeleteTask(null)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#ebe7e2', color: '#6e6e6e', fontSize: 11 }}>No</button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingTask(task); }}
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#eeeae6', boxShadow: '-2px -2px 5px rgba(255,250,244,0.78), 2px 2px 5px rgba(160,143,126,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a9a9a' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#3a3a3a'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9a9a9a'; }}
                    >
                      <Pencil style={{ width: 11, height: 11 }} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDeleteTask(task.id); }}
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#eeeae6', boxShadow: '-2px -2px 5px rgba(255,250,244,0.78), 2px 2px 5px rgba(160,143,126,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a9a9a' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#BD3228'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9a9a9a'; }}
                    >
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 60 }}>
          <Target style={{ width: 28, height: 28, color: '#b3b3b3', strokeWidth: 1.5, marginBottom: 14 }} />
          <p style={{ fontSize: 15, color: '#3a3a3a', fontWeight: 400, marginBottom: 6 }}>No tasks yet</p>
          <p style={{ fontSize: 13, color: '#767676', marginBottom: 16 }}>Add one manually or let the AI agent generate tasks.</p>
          <button onClick={() => setShowAddTask(true)} className="btn-neu flex items-center gap-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 18px', color: '#3a3a3a' }}>
            <Plus style={{ width: 12, height: 12, strokeWidth: 2 }} />
            Add Task
          </button>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <TaskFormModal
          goalId={id}
          onClose={() => setShowAddTask(false)}
          onSave={() => { setShowAddTask(false); refreshTasks(); }}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskFormModal
          task={editingTask}
          goalId={id}
          onClose={() => setEditingTask(null)}
          onSave={() => { setEditingTask(null); refreshTasks(); }}
        />
      )}

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-md" onOpenAutoFocus={e => e.preventDefault()} style={{ background: '#eeeae6', borderRadius: 16, border: 'none', boxShadow: 'none' }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 16, fontWeight: 500, color: '#3a3a3a' }}>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              {selectedTask.assignee_name && (
                <p style={{ fontSize: 12, color: '#767676' }}>Assigned to: {selectedTask.assignee_name}</p>
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
                    queryClient.invalidateQueries({ queryKey: ["goal-tasks", id] });
                    queryClient.invalidateQueries({ queryKey: ["goal", id] });
                    queryClient.invalidateQueries({ queryKey: ["goals"] });
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