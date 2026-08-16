import React, { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

const STATUS_OPTIONS = ["pending", "in_progress", "blocked", "need_help", "done"];

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 10, border: 'none', outline: 'none',
  background: '#ebe7e2',
  boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
  fontSize: 13, color: '#3a3a3a', fontFamily: 'inherit', boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: '#6e6e6e', display: 'block', marginBottom: 6,
};

// goals: optional array for goal selector (when used outside GoalDetail)
export default function TaskFormModal({ task = null, goalId, goals = [], onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    deadline: task?.deadline || '',
    estimated_hours: task?.estimated_hours || '',
    assignee_name: task?.assignee_name || '',
    assignee_id: task?.assignee_id || '',
    assignee_email: task?.assignee_email || '',
    goal_id: task?.goal_id || goalId || (goals[0]?.id || ''),
  });
  const [saving, setSaving] = useState(false);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team"],
    queryFn: () => localClient.entities.User.list(),
  });

  // sync goal_id if goalId prop changes
  useEffect(() => {
    if (goalId && !form.goal_id) setForm(f => ({ ...f, goal_id: goalId }));
  }, [goalId]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        deadline: form.deadline || null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined,
        assignee_name: form.assignee_name || undefined,
        assignee_id: form.assignee_id || undefined,
        assignee_email: form.assignee_email || undefined,
        goal_id: form.goal_id,
        created_by_ai: false,
      };

      // resolve goal_title
      if (goals.length > 0) {
        const g = goals.find(g => g.id === form.goal_id);
        if (g) payload.goal_title = g.title;
      }

      if (isEdit) {
        await localClient.entities.Task.update(task.id, payload);
      } else {
        await localClient.entities.Task.create(payload);
      }
      onSave && onSave();
    } catch (err) {
      console.error("Failed to save task:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(46,42,38,0.30)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#eeeae6', borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 500, position: 'relative', maxHeight: '90dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 18, right: 18, width: 30, height: 30, borderRadius: 8, background: '#ebe7e2', boxShadow: '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.28)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5a5a' }}
        >
          <X style={{ width: 13, height: 13 }} />
        </button>

        <p style={{ fontSize: 15, fontWeight: 600, color: '#3a3a3a', marginBottom: 20 }}>
          {isEdit ? 'Edit Task' : 'Add Task'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Task title" />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional description" />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Deadline</label>
              <input type="date" style={inputStyle} value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Assignee</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.assignee_id}
                onChange={e => {
                  const member = teamMembers.find(m => m.id === e.target.value);
                  setForm(f => ({
                    ...f,
                    assignee_id: member?.id || '',
                    assignee_name: member?.full_name || member?.email || '',
                    assignee_email: member?.email || '',
                  }));
                }}
              >
                <option value="">— Unassigned —</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Estimated Hours</label>
              <input type="number" min="0" step="0.5" style={inputStyle} value={form.estimated_hours} onChange={e => set('estimated_hours', e.target.value)} placeholder="e.g. 3" />
            </div>
          </div>

          {/* Goal selector — only shown when goals array is provided (outside GoalDetail) */}
          {goals.length > 0 && (
            <div>
              <label style={labelStyle}>Goal</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.goal_id} onChange={e => set('goal_id', e.target.value)} required>
                <option value="">— Select a goal —</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#ebe7e2', boxShadow: '-3px -3px 6px rgba(255,250,244,0.78), 3px 3px 6px rgba(160,143,126,0.24)', color: '#6e6e6e', fontSize: 12, fontWeight: 500 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#3a3a3a', color: '#f1f1f0', fontSize: 12, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}