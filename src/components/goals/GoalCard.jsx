import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Trash2, Pencil } from "lucide-react";
import { localClient } from "@/api/localClient";

const statusColors = {
  active:    '#2ECC8A',
  completed: '#C9B3F5',
  draft:     '#B8EFF5',
  paused:    '#FF8077',
};

const STATUS_OPTIONS = ["draft", "active", "paused", "completed"];

export default function GoalCard({ goal, tasks, onDelete, onEdit }) {
  const goalTasks    = tasks.filter(t => t.goal_id === goal.id);
  const doneTasks    = goalTasks.filter(t => t.status === "done").length;
  const blockedCount = goalTasks.filter(t => t.status === "blocked").length;
  const progress     = goalTasks.length > 0 ? Math.round((doneTasks / goalTasks.length) * 100) : 0;

  const statusLabel = {
    active:    'Active',
    draft:     'Draft',
    completed: 'Completed',
    paused:    'Paused',
  }[goal.status] || goal.status;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ title: goal.title, description: goal.description || '', status: goal.status, target_date: goal.target_date || '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    await localClient.entities.Goal.update(goal.id, {
      title: editData.title,
      description: editData.description,
      status: editData.status,
      target_date: editData.target_date || null,
    });
    setSaving(false);
    setShowEdit(false);
    onEdit && onEdit();
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 10, border: 'none', outline: 'none',
    background: '#ebe7e2',
    boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
    fontSize: 13, color: '#3a3a3a', fontFamily: 'inherit',
  };

  const EditModal = () => (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(46,42,38,0.30)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}
      onClick={() => setShowEdit(false)}
    >
      <div
        style={{ background: '#eeeae6', borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 480, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ fontSize: 15, fontWeight: 600, color: '#3a3a3a', marginBottom: 20 }}>Edit Goal</p>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', display: 'block', marginBottom: 6 }}>Title</label>
            <input
              style={inputStyle}
              value={editData.title}
              onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              value={editData.description}
              onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', display: 'block', marginBottom: 6 }}>Status</label>
              <select
                aria-label="Status"
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={editData.status}
                onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', display: 'block', marginBottom: 6 }}>Target Date</label>
              <input
                type="date"
                style={inputStyle}
                value={editData.target_date}
                onChange={e => setEditData(d => ({ ...d, target_date: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" onClick={() => setShowEdit(false)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#ebe7e2', boxShadow: '-3px -3px 6px rgba(255,250,244,0.78), 3px 3px 6px rgba(160,143,126,0.24)', color: '#6e6e6e', fontSize: 12, fontWeight: 500 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#3a3a3a', color: '#f1f1f0', fontSize: 12, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const DeleteControl = () => confirmDelete ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.preventDefault()}>
      <button onClick={e => { e.stopPropagation(); onDelete && onDelete(goal.id); }} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#BD3228', color: '#fff', fontSize: 11, fontWeight: 600 }}>Delete</button>
      <button onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ebe7e2', boxShadow: '-2px -2px 5px rgba(255,250,244,0.78), 2px 2px 5px rgba(160,143,126,0.24)', color: '#6e6e6e', fontSize: 11, fontWeight: 500 }}>Cancel</button>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={e => e.preventDefault()}>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setShowEdit(true); setEditData({ title: goal.title, description: goal.description || '', status: goal.status, target_date: goal.target_date || '' }); }}
        style={{ padding: '5px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#b3b3b3', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#6e6e6e'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#b3b3b3'; }}
      >
        <Pencil style={{ width: 13, height: 13 }} />
      </button>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
        style={{ padding: '5px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#b3b3b3', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#BD3228'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#b3b3b3'; }}
      >
        <Trash2 style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );

  return (
    <>
      {showEdit && <EditModal />}
      {isMobile ? (
        <Link to={`/goals/${goal.id}`} style={{ textDecoration: 'none' }}>
          <motion.div style={{ background: '#eeeae6', boxShadow: '-5px -5px 10px rgba(255,250,244,0.92), 5px 5px 12px rgba(160,143,126,0.36)', borderRadius: 16, padding: '14px 16px' }} whileTap={{ scale: 0.985 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColors[goal.status] || '#C9B3F5', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e' }}>{statusLabel}</span>
                {blockedCount > 0 && <span style={{ fontSize: 11, color: '#BD3228', fontWeight: 500 }}>· {blockedCount} blocked</span>}
              </div>
              <div style={{ background: '#ebe7e2', boxShadow: 'inset -2px -2px 5px rgba(255,250,244,0.80), inset 2px 2px 5px rgba(160,143,126,0.28)', borderRadius: 8, padding: '3px 10px', fontSize: 13, fontWeight: 500, color: '#3a3a3a', letterSpacing: '-0.01em' }}>{progress}%</div>
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#3a3a3a', lineHeight: 1.3, marginBottom: 12 }}>{goal.title}</p>
            <div className="progress-track" style={{ marginBottom: 10 }}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#6e6e6e' }}>{doneTasks}/{goalTasks.length} tasks</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {goal.target_date && <span style={{ fontSize: 12, color: '#767676' }}>{format(new Date(goal.target_date), "MMM d")}</span>}
                <DeleteControl />
              </div>
            </div>
          </motion.div>
        </Link>
      ) : (
        <Link to={`/goals/${goal.id}`} style={{ textDecoration: 'none' }}>
          <motion.div
            className="flex cursor-pointer"
            style={{ background: '#eeeae6', boxShadow: '-5px -5px 10px rgba(255,250,244,0.92), 5px 5px 12px rgba(160,143,126,0.36)', borderRadius: 16, overflow: 'hidden' }}
            whileHover={{ y: -5, boxShadow: '-12px -12px 28px rgba(255,250,244,0.92), 12px 12px 32px rgba(160,143,126,0.44)', transition: { duration: 0.22, ease: 'easeOut' } }}
          >
            <div className="flex-1 flex flex-col" style={{ padding: '18px 20px' }}>
              <div className="mb-3">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', boxShadow: 'inset -2px -2px 5px rgba(255,250,244,0.80), inset 2px 2px 5px rgba(160,143,126,0.28)', background: '#ebe7e2', borderRadius: 9999, padding: '4px 12px' }}>
                  <span className="pip" style={{ background: '#C9B3F5' }} />
                  {statusLabel}
                  {blockedCount > 0 && <span style={{ color: '#BD3228', fontWeight: 500 }}>· {blockedCount} blocked</span>}
                  <span style={{ color: '#767676', fontSize: 11 }}>›</span>
                </span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 500, color: '#3a3a3a', marginBottom: 14, lineHeight: 1.2 }}>{goal.title}</p>
              <div className="progress-track mb-2"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
              <p style={{ fontSize: 12, color: '#6e6e6e', marginBottom: goal.target_date ? 4 : 0 }}>{doneTasks}/{goalTasks.length} tasks · {progress}%</p>
              {goal.target_date && <p style={{ fontSize: 12, color: '#767676' }}>{format(new Date(goal.target_date), "MMM d")}</p>}
            </div>
            <div className="flex flex-col items-center justify-center" style={{ width: 120, flexShrink: 0, padding: '18px 16px', gap: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 500, color: '#3a3a3a', letterSpacing: '-0.02em', lineHeight: 1 }}>{progress}%</span>
              <span style={{ fontSize: 12, color: '#6e6e6e' }}>{doneTasks}/{goalTasks.length}</span>
              <DeleteControl />
            </div>
          </motion.div>
        </Link>
      )}
    </>
  );
}