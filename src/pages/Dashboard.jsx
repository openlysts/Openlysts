import React, { useState, useEffect, useCallback } from "react";
import { localClient } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, X, ArrowRight, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import LiveActivityFeed from "../components/activity/LiveActivityFeed";
import { motion, AnimatePresence } from "framer-motion";
import useCountUp from "@/hooks/useCountUp";

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" },
});

const floatHover = {
  whileHover: {
    y: -5,
    boxShadow: '-12px -12px 28px rgba(255,250,244,0.92), 12px 12px 32px rgba(160,143,126,0.44)',
    transition: { duration: 0.22, ease: 'easeOut' },
  },
};

function getDayGradient(hour) {
  if (hour >= 5 && hour < 11) return 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)';
  if (hour >= 11 && hour < 17) return 'linear-gradient(135deg, #8BC6EC 0%, #9599E2 100%)';
  if (hour >= 17 && hour < 21) return 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)';
  return 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => localClient.entities.Goal.list("-created_date", 50)
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => localClient.entities.Task.list("-created_date", 100)
  });
  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => localClient.entities.AgentActivity.list("-created_date", 20),
    refetchInterval: 15000
  });

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const greetingText = greeting();
  const alreadySeen = sessionStorage.getItem("intro_seen");
  const [introPhase, setIntroPhase] = useState(alreadySeen ? "done" : "center");
  useEffect(() => {
    if (alreadySeen) return;
    const t = setTimeout(() => {
      setIntroPhase("done");
      sessionStorage.setItem("intro_seen", "1");
    }, 1900);
    return () => clearTimeout(t);
  }, []);

  const [ringOpen, setRingOpen] = useState(false);

  const activeGoals = goals.filter((g) => g.status === "active");
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const overallProgress = tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0;

  // Top 3 pending tasks (not done), prioritised: blocked first, then by deadline
  const top3Remaining = [...tasks]
    .filter(t => t.status !== "done")
    .sort((a, b) => {
      if (a.status === "blocked" && b.status !== "blocked") return -1;
      if (b.status === "blocked" && a.status !== "blocked") return 1;
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    })
    .slice(0, 3);

  const animEnabled = introPhase === "done";
  const animProgress   = useCountUp(overallProgress, 1000, animEnabled);
  const animActive     = useCountUp(activeGoals.length, 900, animEnabled);
  const animBlocked    = useCountUp(blockedTasks, 900, animEnabled);
  const animDone       = useCountUp(doneTasks, 900, animEnabled);
  const animTotalTasks = useCountUp(tasks.length, 900, animEnabled);
  const animDonePct    = useCountUp(tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0, 1000, animEnabled);

  const letterVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.05, duration: 0.32, ease: "easeOut" }
    }),
  };

  const greetingWithDot = greetingText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ".";

  return (
    <div
      className="flex flex-col gap-5"
      style={{
        position: 'relative',
        padding: 'clamp(12px, 3vw, 24px) clamp(12px, 4vw, 28px) 12px',
        boxSizing: 'border-box',
        height: '100%',
        overflow: 'visible',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}
    >

      {/* ── Intro overlay ── */}
      <AnimatePresence>
        {introPhase === "center" && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#ebe7e2',
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex' }}>
              {greetingWithDot.split("").map((char, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={letterVariants}
                  style={{
                    fontSize: 48, fontWeight: 300, color: '#3a3a3a',
                    letterSpacing: '-0.01em', whiteSpace: 'pre',
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Row 1: Header + New Goal button ── */}
      {introPhase === "done" && (
        <motion.div
          className="mobile-header-hide flex items-start justify-between flex-shrink-0"
          {...fadeUp(0)}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 6 }}>
              {greetingText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}.
            </h1>
            <p style={{ fontSize: 14, color: '#6e6e6e', lineHeight: 1.5 }}>
              Here's what's happening across your projects today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* User avatar + Log Out / Log In */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <div
                  className="flex items-center gap-2.5"
                  style={{
                    padding: '11px 16px',
                    borderRadius: 'var(--radius-button)',
                    background: '#ebe7e2',
                    boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    userSelect: 'none',
                  }}
                  onClick={() => setUserMenuOpen(v => !v)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ebe7e2'; }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: '#FFCBDE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#5a5350' }}>
                      {(user.full_name || user.email)?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#6e6e6e', whiteSpace: 'nowrap' }}>
                    {user.full_name || user.email}
                  </span>
                </div>
                {userMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setUserMenuOpen(false)} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                      background: '#eeeae6',
                      boxShadow: '-6px -6px 12px rgba(255,250,244,0.78), 6px 6px 14px rgba(160,143,126,0.31)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      minWidth: 160,
                    }}>
                      <button
                        onClick={() => { localClient.auth.logout(); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', border: 'none', background: 'transparent',
                          cursor: 'pointer', fontSize: 13, color: '#BD3228', fontWeight: 500,
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(189,50,40,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <LogOut style={{ width: 14, height: 14 }} />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                className="btn-neu flex items-center gap-2"
                onClick={() => localClient.auth.redirectToLogin(window.location.href)}
                style={{
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '11px 20px', color: '#3a3a3a', whiteSpace: 'nowrap',
                }}>
                Log In
              </button>
            )}

            <Link to="/goals?new=true">
              <button
                className="btn-neu flex items-center gap-2"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '11px 20px',
                  color: '#3a3a3a',
                  whiteSpace: 'nowrap',
                }}>
                <Plus style={{ width: 13, height: 13, strokeWidth: 2 }} />
                New Goal
              </button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Main 2-column grid — fills remaining space ── */}
      {introPhase === "done" && (
        <motion.div
          className="tablet-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gridTemplateRows: (isMobile || isTablet) ? 'auto' : '180px 1fr',
            gap: 20,
            flex: (isMobile || isTablet) ? 'none' : '1 1 0',
            minHeight: 0,
            width: '100%',
            minWidth: 0,
          }}
          {...fadeUp(0.08)}
          id="dashboard-grid"
        >
          {/* TOP-LEFT: image card + progress circle side by side */}
          <div style={{ display: 'flex', gap: 16, flexDirection: 'row', height: (isMobile || isTablet) ? 'auto' : '100%', minWidth: 0 }}>
            {/* Card 1 — background image, grows to fill */}
            <motion.div
              className="neu-raised"
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-card)', flex: isMobile ? '1 1 50%' : 1, maxWidth: isMobile ? '50%' : undefined, height: isMobile ? 150 : (isTablet ? 200 : '100%'), minHeight: isMobile ? 150 : 'unset', minWidth: 0 }}
              {...floatHover}
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: getDayGradient(now.getHours()),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.8
              }} />
              <div style={{ position: 'relative', padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-start', height: '100%' }}>
                <div style={{
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                  background: '#eeeae6',
                  boxShadow: '-5px -5px 10px rgba(255,250,244,0.78), 5px 5px 12px rgba(160,143,126,0.27)',
                  borderRadius: 12, padding: '8px 12px',
                }}>
                  <span style={{ fontSize: 'clamp(28px, 3.5vw, 52px)', fontWeight: 300, color: '#2e2a26', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {now.toLocaleDateString('en-GB', { day: '2-digit' })}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#7a7470', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 0 }}>
                    {now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 2 — interactive progress circle, perfect square */}
            <motion.div
              className="neu-raised flex items-center justify-center"
              style={{ padding: '6px', cursor: 'pointer', position: 'relative', overflow: 'hidden', flex: isMobile ? '1 1 50%' : undefined, maxWidth: isMobile ? '50%' : undefined, width: isMobile ? undefined : 180, height: isMobile ? 150 : 180, flexShrink: isMobile ? 1 : 0, minWidth: 0 }}
              onClick={() => setRingOpen(v => !v)}
              whileHover={{ y: -5, boxShadow: '-12px -12px 28px rgba(255,250,244,0.92), 12px 12px 32px rgba(160,143,126,0.44)', transition: { duration: 0.22, ease: 'easeOut' } }}
            >
              {/* Default: % circle */}
              <AnimatePresence mode="wait">
                {!ringOpen ? (
                  <motion.div
                    key="circle"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: 'calc(100% - 12px)', height: 'calc(100% - 12px)',
                      borderRadius: '50%',
                      boxShadow: 'inset -4px -4px 8px rgba(255,250,244,0.80), inset 4px 4px 8px rgba(160,143,126,0.28)',
                      background: '#ebe7e2',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 'clamp(28px, 3.5vw, 52px)', fontWeight: 300, color: '#3a3a3a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {animProgress}%
                    </span>
                    <span style={{ fontSize: 10, color: '#767676', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>done</span>

                  </motion.div>
                ) : (
                  <motion.div
                    key="tasks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: '100%', height: '100%', padding: '14px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between" style={{ marginBottom: 8, flexShrink: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e6e6e' }}>
                        Next up
                      </p>
                      <button
                        onClick={() => setRingOpen(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9a9a9a' }}
                      >
                        <X style={{ width: 12, height: 12 }} />
                      </button>
                    </div>

                    {/* Task list */}
                    <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
                      {top3Remaining.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#2ECC8A', fontWeight: 500, textAlign: 'center', marginTop: 12 }}>All done! 🎉</p>
                      ) : top3Remaining.map((t, i) => (
                        <Link key={t.id} to={`/goals/${t.goal_id}`} style={{ textDecoration: 'none' }} onClick={() => setRingOpen(false)}>
                          <motion.div
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 7,
                              padding: '7px 8px', borderRadius: 8,
                              background: '#ebe7e2',
                              boxShadow: 'inset -2px -2px 4px rgba(255,250,244,0.68), inset 2px 2px 4px rgba(160,143,126,0.22)',
                            }}
                          >
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                              background: t.status === 'blocked' ? '#FF7043' : '#C9B3F5',
                            }} />
                            <p style={{ fontSize: 11, color: '#3a3a3a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                              {t.title}
                            </p>
                            <ArrowRight style={{ width: 10, height: 10, color: '#b3b3b3', flexShrink: 0 }} />
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* TOP-RIGHT: Stats card */}
          {isMobile ? (
            <motion.div
              className="neu-raised"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, padding: '14px 10px', boxSizing: 'border-box', width: '100%', maxWidth: '100%', minWidth: 0 }}
              {...floatHover}
            >
              {[
                { label: 'Active Goals', value: animActive, sub: `${animTotalTasks} tasks`, link: '/goals' },
                { label: 'Blocked', value: animBlocked, sub: `${animDone} done`, link: '/my-tasks' },
                { label: 'Completed', value: animDone, sub: `${animDonePct}% total`, link: '/my-tasks' },
              ].map(({ label, value, sub, link }) => (
                <Link key={label} to={link} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6e6e6e', textAlign: 'center', lineHeight: 1.3 }}>{label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: '1/1', borderRadius: 10, background: '#ebe7e2', boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)' }}>
                      <span style={{ fontSize: 30, fontWeight: 400, color: '#3a3a3a', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#665f57', textAlign: 'center' }}>{sub}</p>
                  </div>
                </Link>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="neu-raised"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '20px 24px', gap: 16 }}
              {...floatHover}
            >
              {[
                { label: 'Active Goals', value: animActive, sub: `${animTotalTasks} total tasks`, link: '/goals' },
                { label: 'Blocked Tasks', value: animBlocked, sub: `${animDone} completed`, link: '/my-tasks' },
                { label: 'Completed Tasks', value: animDone, sub: `${animDonePct}% of total`, link: '/my-tasks' },
              ].map(({ label, value, sub, link }) => (
                <Link key={label} to={link} style={{ textDecoration: 'none', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 8px', borderRadius: 12, cursor: 'pointer' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e6e6e', marginBottom: 10, whiteSpace: 'nowrap' }}>{label}</p>
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 88, height: 88, borderRadius: 12, background: '#ebe7e2', boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#ebe7e2'; }}
                    >
                      <span style={{ fontSize: 'clamp(28px, 3.5vw, 52px)', fontWeight: 300, color: '#3a3a3a', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#665f57', marginTop: 4 }}>{sub}</p>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}

          {/* BOTTOM-LEFT: Activity feed */}
          <div className="flex flex-col min-h-0" style={{ minWidth: 0 }}>
            <LiveActivityFeed activities={activities} tasks={tasks} />
          </div>

          {/* BOTTOM-RIGHT: Goals list */}
          <motion.div
            className="neu-raised flex flex-col min-h-0"
            style={{ padding: '20px 18px 0 18px', minWidth: 0 }}
            {...floatHover}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 20, flexShrink: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e6e6e' }}>
                Goals
              </p>
              <Link
                to="/goals"
                className="flex items-center gap-1"
                style={{ fontSize: 12, fontWeight: 500, color: '#6e6e6e', textDecoration: 'none' }}
              >
                Full log <ArrowRight style={{ width: 12, height: 12, strokeWidth: 1.5 }} />
              </Link>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto" style={{ marginTop: 0, paddingBottom: 18 }}>
              {goals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {goals.map((goal) => {
                    const goalTasks = tasks.filter((t) => t.goal_id === goal.id);
                    const done = goalTasks.filter((t) => t.status === "done").length;
                    const pct = goalTasks.length > 0 ? Math.round(done / goalTasks.length * 100) : 0;
                    const r = 27;
                    const circumference = 2 * Math.PI * r;
                    const offset = circumference - (pct / 100) * circumference;
                    return (
                      <Link key={goal.id} to={`/goals/${goal.id}`} style={{ textDecoration: 'none' }}>
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                            background: '#ebe7e2',
                            boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
                            gap: 10,
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#ebe7e2'; }}
                        >
                          {/* Title + sub */}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{
                              fontSize: 13, fontWeight: 500, color: '#3a3a3a',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4,
                            }}>
                              {goal.title}
                            </p>
                            <p style={{ fontSize: 11, color: '#767676', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {goalTasks.length > 0
                                ? `${done}/${goalTasks.length} tasks · ${goalTasks.filter(t => t.status === 'blocked').length > 0 ? `${goalTasks.filter(t => t.status === 'blocked').length} blocked` : 'on track'}`
                                : 'No tasks yet'}
                            </p>
                          </div>
                          {/* Circle progress */}
                          <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
                            <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(160,143,126,0.18)" strokeWidth="3" />
                              <circle
                                cx="30" cy="30" r={r} fill="none"
                                stroke="#2ECC8A" strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                              />
                            </svg>
                            <span style={{
                              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, fontWeight: 500, color: '#3a3a3a', letterSpacing: '-0.02em',
                            }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#767676' }}>No active goals yet.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}