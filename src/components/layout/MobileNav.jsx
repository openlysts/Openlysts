import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Target, CheckSquare, Activity, Users, Settings, Menu, X, ListTodo } from "lucide-react";
import LogoIcon from "./LogoIcon";

const BOTTOM_NAV = [
  { path: "/",         icon: LayoutDashboard, label: "Home"  },
  { path: "/goals",    icon: Target,          label: "Goals" },
  { path: "/my-tasks", icon: CheckSquare,     label: "My Tasks" },
  { path: "/activity", icon: Activity,        label: "Agent" },
];

const DRAWER_NAV = [
  { path: "/tasks",    icon: ListTodo, label: "Tasks"    },
  { path: "/team",     icon: Users,    label: "Team"     },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function MobileNav() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {/* ── Bottom nav bar ── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#eeeae6',
          boxShadow: '0 -4px 20px rgba(160,143,126,0.22)',
          borderRadius: '20px 20px 0 0',
          padding: '8px 8px 12px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {BOTTOM_NAV.map(({ path, icon: Icon, label }) => (
          <Link key={path} to={path} style={{ textDecoration: 'none', flex: 1 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 14,
                background: isActive(path) ? '#ebe7e2' : 'transparent',
                boxShadow: isActive(path)
                  ? 'inset -3px -3px 6px rgba(255,252,248,0.75), inset 3px 3px 6px rgba(180,165,150,0.32)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon style={{ width: 20, height: 20, strokeWidth: 1.5, color: isActive(path) ? '#3a3a3a' : '#767676' }} />
              <span style={{ fontSize: 9, fontWeight: isActive(path) ? 600 : 400, color: isActive(path) ? '#3a3a3a' : '#767676', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
              </span>
            </div>
          </Link>
        ))}

        {/* Hamburger button */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '8px 4px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: drawerOpen ? '#ebe7e2' : 'transparent',
            boxShadow: drawerOpen ? 'inset -3px -3px 6px rgba(255,252,248,0.75), inset 3px 3px 6px rgba(180,165,150,0.32)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Menu style={{ width: 20, height: 20, strokeWidth: 1.5, color: '#767676' }} />
          <span style={{ fontSize: 9, fontWeight: 400, color: '#767676', letterSpacing: '0.05em', textTransform: 'uppercase' }}>More</span>
        </button>
      </nav>

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Drawer panel ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: '#eeeae6',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 32px rgba(160,143,126,0.28)',
          padding: '20px 20px 40px 20px',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 9999, background: '#ccc7c0', margin: '0 auto 20px auto' }} />

        {/* Close + brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoIcon size={9} />
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', color: '#2f2823', textTransform: 'uppercase' }}>
              ORBITAL
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ background: '#eeeae6', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10, boxShadow: '-3px -3px 6px rgba(255,250,244,0.78), 3px 3px 6px rgba(160,143,126,0.27)' }}
          >
            <X style={{ width: 16, height: 16, color: '#6e6e6e' }} />
          </button>
        </div>

        {/* Drawer nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DRAWER_NAV.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              style={{ textDecoration: 'none' }}
              onClick={() => setDrawerOpen(false)}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderRadius: 14,
                  background: isActive(path) ? '#ebe7e2' : '#eeeae6',
                  boxShadow: isActive(path)
                    ? 'inset -3px -3px 6px rgba(255,252,248,0.75), inset 3px 3px 6px rgba(180,165,150,0.32)'
                    : '-3px -3px 6px rgba(255,250,244,0.78), 3px 3px 6px rgba(160,143,126,0.22)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon style={{ width: 20, height: 20, strokeWidth: 1.5, color: isActive(path) ? '#3a3a3a' : '#6e6e6e' }} />
                <span style={{ fontSize: 14, fontWeight: isActive(path) ? 600 : 400, color: isActive(path) ? '#3a3a3a' : '#6e6e6e' }}>
                  {label}
                </span>
              </div>
            </Link>
          ))}


        </div>
      </div>
    </>
  );
}