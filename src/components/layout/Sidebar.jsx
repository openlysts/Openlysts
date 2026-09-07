import React, { useState, useEffect } from "react";
import LogoIcon from "./LogoIcon";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard, Target, CheckSquare, Activity, Users, Settings } from "lucide-react";
import { localClient } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { useLogoEasterEgg } from "@/hooks/useLogoEasterEgg";

const WORKSPACE_NAV = [
  { path: "/",         icon: LayoutDashboard, label: "Dashboard"      },
  { path: "/goals",    icon: Target,          label: "Goals"          },
  { path: "/my-tasks", icon: CheckSquare,     label: "My Tasks"       },
];

const MANAGEMENT_NAV = [
  { path: "/activity", icon: Activity, label: "Agent Activity" },
  { path: "/team",     icon: Users,    label: "Team"           },
  { path: "/settings", icon: Settings, label: "Settings"       },
];

function AnalogClock({ collapsed }) {
  const [angles, setAngles] = useState({ hr: 0, min: 0, sec: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ms  = now.getMilliseconds();
      const sec = now.getSeconds() + ms / 1000;
      const min = now.getMinutes() + sec / 60;
      const hr  = (now.getHours() % 12) + min / 60;
      setAngles({
        sec: (sec / 60) * 360 - 90,
        min: (min / 60) * 360 - 90,
        hr:  (hr  / 12) * 360 - 90,
      });
    };
    tick();
    const timer = setInterval(tick, 50);
    return () => clearInterval(timer);
  }, []);

  const size = collapsed ? 44 : 80;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  const { hr: hrAngle, min: minAngle, sec: secAngle } = angles;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const hand = (angle, length) => ({
    x: cx + Math.cos(toRad(angle)) * length,
    y: cy + Math.sin(toRad(angle)) * length,
  });

  const secTip = hand(secAngle, r * 0.82);
  const minTip = hand(minAngle, r * 0.72);
  const hrTip  = hand(hrAngle,  r * 0.52);

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: '#ebe7e2',
      boxShadow: 'inset -4px -4px 8px rgba(255,250,244,0.80), inset 4px 4px 8px rgba(160,143,126,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size} height={size}>
        {/* Hour hand */}
        <line x1={cx} y1={cy} x2={hrTip.x} y2={hrTip.y}
          stroke="#5a5a5a" strokeWidth={collapsed ? 1.8 : 2.5} strokeLinecap="round" />
        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={minTip.x} y2={minTip.y}
          stroke="#8a8a8a" strokeWidth={collapsed ? 1.2 : 1.8} strokeLinecap="round" />
        {/* Second hand */}
        <line x1={cx} y1={cy} x2={secTip.x} y2={secTip.y}
          stroke="#b8b4b0" strokeWidth={collapsed ? 0.8 : 1} strokeLinecap="round" />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={collapsed ? 1.8 : 2.5} fill="#5a5a5a" />
      </svg>
    </div>
  );
}

function NavSection({ label, items, location, collapsed }) {
  return (
    <div className="mb-5">
      {!collapsed && (
        <div className="flex items-center gap-2 mb-2 px-2">
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#767676',
          }}>
            {label}
          </span>
        </div>
      )}
      <nav className="space-y-1">
        {items.map(({ path, icon: Icon, label: itemLabel }) => {
          const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? itemLabel : undefined}
              className="flex items-center gap-2.5 transition-all duration-150"
              style={{
                padding: collapsed ? '9px 10px' : '9px 14px',
                borderRadius: 10,
                color: isActive ? '#3a3a3a' : '#6e6e6e',
                fontWeight: isActive ? 500 : 400,
                fontSize: 14,
                justifyContent: collapsed ? 'center' : 'flex-start',
                boxShadow: isActive
                  ? 'inset -3px -3px 6px rgba(255,252,248,0.75), inset 3px 3px 6px rgba(180,165,150,0.32)'
                  : 'none',
                background: isActive ? '#ebe7e2' : 'transparent',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#3a3a3a';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#6e6e6e';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon style={{ width: 16, height: 16, strokeWidth: 1.5, flexShrink: 0 }} />
              {!collapsed && <span>{itemLabel}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const handleLogoClick = useLogoEasterEgg();


  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-sidebar"],
    queryFn: () => localClient.entities.Task.list("-created_date", 100),
    refetchInterval: 60000,
  });

  const blockedCount = tasks.filter(t => t.status === "blocked").length;
  const doneCount    = tasks.filter(t => t.status === "done").length;

  return (
    <aside
      className="sidebar-float flex-shrink-0 flex flex-col self-start"
      style={{
        width: collapsed ? 64 : 240,
        position: 'sticky',
        top: 0,
        height: 'calc(100vh - 40px)',
        transition: 'width 200ms ease',
        overflow: 'hidden',
        padding: '28px 16px 16px 16px',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center mb-8"
        style={{ justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? 0 : 10 }}
      >
        <Link to="/" onClick={handleLogoClick} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoIcon size={collapsed ? 8.8 : 11} />
          {!collapsed && (
            <span style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: '#2f2823',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              ORBITAL
            </span>
          )}
        </Link>
      </div>

      {/* Nav sections */}
      <div className="flex-1">
        <NavSection label="Workspace"  items={WORKSPACE_NAV}  location={location} collapsed={collapsed} />
        <NavSection label="Management" items={MANAGEMENT_NAV} location={location} collapsed={collapsed} />
      </div>

      {/* Footer stats + collapse toggle */}
      <div className="mt-auto flex flex-col items-center gap-3">


        {/* Analog Clock + Stats box */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10 }}>
          <AnalogClock collapsed={collapsed} />
          {!collapsed && (() => {
            const today = new Date(); today.setHours(0,0,0,0);
            const overdueCount = tasks.filter(t => t.status !== 'done' && t.deadline && new Date(t.deadline) < today).length;
            return (
              <Link to="/my-tasks" style={{ flex: 1, textDecoration: 'none' }}>
              <div
                style={{
                  height: 80,
                  background: '#ebe7e2',
                  boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: '0 12px',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ebe7e2'; }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#767676' }}>Tasks Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF8077', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#3a3a3a', lineHeight: 1 }}>{blockedCount}</span>
                  <span style={{ fontSize: 11, color: '#767676' }}>Blocked</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4996A', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#3a3a3a', lineHeight: 1 }}>{overdueCount}</span>
                  <span style={{ fontSize: 11, color: '#767676' }}>Overdue</span>
                </div>
              </div>
              </Link>
            );
          })()}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center transition-all duration-150"
          style={{
            padding: '8px',
            borderRadius: 10,
            color: '#767676',
            background: '#eeeae6',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '-5px -5px 10px rgba(255,250,244,0.78), 5px 5px 12px rgba(160,143,126,0.27)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '-8px -8px 16px rgba(255,250,244,0.92), 8px 8px 18px rgba(160,143,126,0.38)';
            e.currentTarget.style.background = '#f5f2ef';
            e.currentTarget.style.color = '#3a3a3a';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '-5px -5px 10px rgba(255,250,244,0.78), 5px 5px 12px rgba(160,143,126,0.27)';
            e.currentTarget.style.background = '#eeeae6';
            e.currentTarget.style.color = '#767676';
          }}
        >
          <ChevronRight
            style={{
              width: 14, height: 14, strokeWidth: 1.5,
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </button>
      </div>
    </aside>
  );
}