import React, { useState } from "react";
import { motion } from "framer-motion";
import { localClient } from "@/api/localClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Mail, Loader2, Bot, Sparkles, X } from "lucide-react";
import ProgressRing from "../components/shared/ProgressRing";

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 10, border: 'none', outline: 'none',
  background: '#ebe7e2',
  boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
  fontSize: 13, color: '#3a3a3a', fontFamily: 'inherit', boxSizing: 'border-box',
};

export default function Team() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const queryClient = useQueryClient();
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', description: '', instructions: '' });
  const [creatingAgent, setCreatingAgent] = useState(false);

  const { data: agents = [], refetch: refetchAgents, isLoading: loadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: () => localClient.entities.Agent.list("-created_date", 50),
  });

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setCreatingAgent(true);
    await localClient.entities.Agent.create({
      name: agentForm.name,
      description: agentForm.description,
      instructions: agentForm.instructions,
    });
    setAgentForm({ name: '', description: '', instructions: '' });
    setShowAgentForm(false);
    setCreatingAgent(false);
    refetchAgents();
  };

  const { data: members = [] } = useQuery({
    queryKey: ["team"],
    queryFn: () => localClient.entities.User.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => localClient.entities.Task.list("-created_date", 200),
  });

  const getMemberStats = (member) => {
    const memberTasks = tasks.filter(t => t.assignee_email === member.email);
    const done = memberTasks.filter(t => t.status === "done").length;
    const blocked = memberTasks.filter(t => t.status === "blocked").length;
    const progress = memberTasks.length > 0 ? Math.round((done / memberTasks.length) * 100) : 0;
    return { total: memberTasks.length, done, blocked, progress };
  };

  const handleRemove = async (memberId) => {
    await localClient.entities.User.delete(memberId);
    setConfirmRemove(null);
    queryClient.invalidateQueries({ queryKey: ["team"] });
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    await localClient.users.inviteUser(inviteEmail, inviteRole === "lead" ? "admin" : "user");
    setInviteEmail("");
    setShowInvite(false);
    setInviting(false);
  };

  return (
    <div className="page-container" style={{ padding: '24px 28px', boxSizing: 'border-box', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4 }}>
            Team
          </h1>
          <p style={{ fontSize: 14, color: '#6e6e6e' }}>
            {members.length} team member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="btn-neu flex items-center gap-2"
          style={{ padding: '9px 18px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3a3a3a', flexShrink: 0, marginLeft: 12 }}
        >
          <Plus style={{ width: 12, height: 12, strokeWidth: 2 }} />
          <span className="hidden sm:inline">Invite Member</span>
          <span className="sm:hidden">Invite</span>
        </button>
      </div>

      {/* Member grid */}
      {members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const stats = getMemberStats(member);
            const initials = (member.full_name || member.email)?.[0]?.toUpperCase();
            const isAdmin = member.role === "admin" || member.role === "lead";

            return (
              <motion.div
                key={member.id}
                className="neu-raised"
                style={{ padding: '20px 22px' }}
                whileHover={{
                  y: -5,
                  boxShadow: '-12px -12px 28px rgba(255,250,244,0.92), 12px 12px 32px rgba(160,143,126,0.44)',
                  transition: { duration: 0.22, ease: 'easeOut' },
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: '#ebe7e2',
                      boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#5a5350' }}>{initials}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#3a3a3a', marginBottom: 2 }}>
                        {member.full_name || member.email}
                      </p>
                      {/* Role badge */}
                      <span style={{
                        display: 'inline-block', marginTop: 5,
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: 6,
                        background: '#ebe7e2',
                        boxShadow: 'inset -2px -2px 4px rgba(255,250,244,0.68), inset 2px 2px 4px rgba(160,143,126,0.22)',
                        color: isAdmin ? '#996CE4' : '#6e6e6e',
                      }}>
                        {isAdmin ? "Lead" : "Member"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ProgressRing value={stats.progress} size={44} strokeWidth={3} />
                    {confirmRemove === member.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 11, color: '#6e6e6e', whiteSpace: 'nowrap' }}>Remove?</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => handleRemove(member.id)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#BD3228', color: '#fff', fontSize: 11, fontWeight: 600 }}>Yes</button>
                          <button onClick={() => setConfirmRemove(null)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#ebe7e2', boxShadow: '-2px -2px 4px rgba(255,250,244,0.78), 2px 2px 4px rgba(160,143,126,0.22)', color: '#6e6e6e', fontSize: 11 }}>No</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(member.id)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#eeeae6', boxShadow: '-2px -2px 5px rgba(255,250,244,0.78), 2px 2px 5px rgba(160,143,126,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b3b3b3', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#BD3228'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#b3b3b3'; }}
                      >
                        <X style={{ width: 12, height: 12 }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 10, marginTop: 4,
                }}>
                  {[
                    { label: 'Tasks', value: stats.total, dot: '#9a9a9a' },
                    { label: 'Done', value: stats.done, dot: '#2ECC8A' },
                    { label: 'Blocked', value: stats.blocked, dot: stats.blocked > 0 ? '#FF7043' : '#b3b3b3' },
                  ].map(({ label, value, dot }) => (
                    <div
                      key={label}
                      style={{
                        padding: '10px 0',
                        borderRadius: 10,
                        background: '#ebe7e2',
                        boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.22)',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: 18, fontWeight: 500, color: '#3a3a3a', lineHeight: 1, marginBottom: 4 }}>{value}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
                        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9a9a' }}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', marginBottom: 16,
            background: '#ebe7e2',
            boxShadow: 'inset -4px -4px 8px rgba(255,250,244,0.68), inset 4px 4px 8px rgba(160,143,126,0.24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users style={{ width: 22, height: 22, color: '#b3b3b3', strokeWidth: 1.5 }} />
          </div>
          <p style={{ fontSize: 15, color: '#3a3a3a', fontWeight: 400, marginBottom: 6 }}>No team members yet</p>
          <p style={{ fontSize: 13, color: '#767676', marginBottom: 20 }}>Invite your team to get started.</p>
          <button
            onClick={() => setShowInvite(true)}
            className="btn-neu flex items-center gap-2"
            style={{ padding: '9px 18px', fontSize: 13, fontWeight: 500, color: '#3a3a3a' }}
          >
            <Plus style={{ width: 14, height: 14, strokeWidth: 2 }} />
            Invite Member
          </button>
        </div>
      )}

      {/* AI Agents section */}
      <div style={{ marginTop: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: '#3a3a3a', marginBottom: 2 }}>AI Agents</h2>
            <p style={{ fontSize: 13, color: '#6e6e6e' }}>Autonomous assistants that help manage your project</p>
          </div>
          <button
            onClick={() => setShowAgentForm(true)}
            className="btn-neu flex items-center gap-2"
            style={{ padding: '9px 18px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3a3a3a', flexShrink: 0 }}
          >
            <Plus style={{ width: 12, height: 12, strokeWidth: 2 }} />
            New Agent
          </button>
        </div>

        {loadingAgents ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Loader2 style={{ width: 20, height: 20, color: '#b3b3b3', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(agent => (
              <div key={agent.id || agent.name} className="neu-raised" style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: '#ebe7e2', boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot style={{ width: 17, height: 17, color: '#996CE4', strokeWidth: 1.5 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#3a3a3a' }}>{agent.name}</p>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 5, background: '#ebe7e2', boxShadow: 'inset -2px -2px 4px rgba(255,250,244,0.68), inset 2px 2px 4px rgba(160,143,126,0.22)', color: '#996CE4' }}>
                      AI
                    </span>
                  </div>
                  {agent.description && <p style={{ fontSize: 12, color: '#767676', lineHeight: 1.5 }}>{agent.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="neu-inset" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <Sparkles style={{ width: 22, height: 22, color: '#b3b3b3', strokeWidth: 1.5, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, color: '#3a3a3a', fontWeight: 400, marginBottom: 4 }}>No agents yet</p>
            <p style={{ fontSize: 12, color: '#767676' }}>Create an AI agent to automate project tasks.</p>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showAgentForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(46,42,38,0.30)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }} onClick={() => setShowAgentForm(false)}>
          <div style={{ background: '#eeeae6', borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 480, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAgentForm(false)} style={{ position: 'absolute', top: 18, right: 18, width: 30, height: 30, borderRadius: 8, background: '#ebe7e2', boxShadow: '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.28)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5a5a' }}>
              <X style={{ width: 13, height: 13 }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Bot style={{ width: 18, height: 18, color: '#996CE4', strokeWidth: 1.5 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#3a3a3a' }}>Create AI Agent</p>
            </div>
            <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', display: 'block', marginBottom: 6 }}>Name *</label>
                <input style={inputStyle} value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Project Manager" required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', display: 'block', marginBottom: 6 }}>Description</label>
                <input style={inputStyle} value={agentForm.description} onChange={e => setAgentForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this agent do?" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e6e', display: 'block', marginBottom: 6 }}>Instructions</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }} value={agentForm.instructions} onChange={e => setAgentForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Describe how the agent should behave and what it should focus on..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAgentForm(false)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#ebe7e2', boxShadow: '-3px -3px 6px rgba(255,250,244,0.78), 3px 3px 6px rgba(160,143,126,0.24)', color: '#6e6e6e', fontSize: 12, fontWeight: 500 }}>
                  Cancel
                </button>
                <button type="submit" disabled={creatingAgent} style={{ padding: '8px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#3a3a3a', color: '#f1f1f0', fontSize: 12, fontWeight: 600, opacity: creatingAgent ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 7 }}>
                  {creatingAgent ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 0.8s linear infinite' }} /> : <Sparkles style={{ width: 12, height: 12 }} />}
                  {creatingAgent ? 'Creating…' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontSize: 16, fontWeight: 500, color: '#3a3a3a' }}>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ fontSize: 12, fontWeight: 500, color: '#6e6e6e', marginBottom: 6, display: 'block' }}>Email</Label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{
                  width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', outline: 'none',
                  background: '#ebe7e2',
                  boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.22)',
                  fontSize: 13, color: '#3a3a3a',
                }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 12, fontWeight: 500, color: '#6e6e6e', marginBottom: 6, display: 'block' }}>Role</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['member', 'lead'].map(r => (
                  <button
                    key={r}
                    onClick={() => setInviteRole(r)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: inviteRole === r ? 500 : 400,
                      color: inviteRole === r ? '#3a3a3a' : '#767676',
                      background: '#ebe7e2',
                      boxShadow: inviteRole === r
                        ? 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.22)'
                        : '-3px -3px 6px rgba(255,250,244,0.78), 3px 3px 6px rgba(160,143,126,0.24)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowInvite(false)}
              className="btn-neu"
              style={{ padding: '8px 16px', fontSize: 13, color: '#6e6e6e' }}
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={!inviteEmail || inviting}
              style={{
                padding: '8px 18px', borderRadius: 12, border: 'none', cursor: !inviteEmail || inviting ? 'default' : 'pointer',
                background: '#3a3a3a', color: '#f1f1f0', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 7,
                opacity: !inviteEmail || inviting ? 0.5 : 1,
                boxShadow: '-4px -4px 8px rgba(255,255,255,0.085), 4px 4px 10px rgba(0,0,0,0.30)',
              }}
            >
              {inviting ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 0.8s linear infinite' }} /> : <Mail style={{ width: 13, height: 13 }} />}
              Send Invite
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}