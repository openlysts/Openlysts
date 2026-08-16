import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Target, CheckSquare, Activity, Users, Settings } from "lucide-react";
import LogoIcon from "./LogoIcon";

const ALL_NAV = [
  { path: "/",         icon: LayoutDashboard, label: "Home"     },
  { path: "/goals",    icon: Target,          label: "Goals"    },
  { path: "/my-tasks", icon: CheckSquare,     label: "Tasks"    },
  { path: "/activity", icon: Activity,        label: "Activity" },
  { path: "/team",     icon: Users,           label: "Team"     },
  { path: "/settings", icon: Settings,        label: "Settings" },
];

export default function TabletNav() {
  const location = useLocation();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: '#eeeae6',
        boxShadow: '-8px -8px 16px rgba(255,250,244,0.78), 8px 8px 18px rgba(160,143,126,0.31)',
        borderRadius: 20,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {/* Logo mark */}
      <div style={{ padding: '4px 10px 4px 4px', borderRight: '1px solid rgba(160,143,126,0.18)', marginRight: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <LogoIcon size={9} />
        <span style={{
          fontFamily: "'Archivo', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.18em',
          color: '#2f2823',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          ORBITAL
        </span>
      </div>

      {ALL_NAV.map(({ path, icon: Icon, label }) => {
        const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
        return (
          <Link
            key={path}
            to={path}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 12px',
                borderRadius: 12,
                background: isActive ? '#ebe7e2' : 'transparent',
                boxShadow: isActive
                  ? 'inset -3px -3px 6px rgba(255,252,248,0.75), inset 3px 3px 6px rgba(180,165,150,0.32)'
                  : 'none',
                transition: 'all 0.15s ease',
                minWidth: 52,
              }}
            >
              <Icon style={{ width: 18, height: 18, strokeWidth: 1.5, color: isActive ? '#3a3a3a' : '#767676' }} />
              <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400, color: isActive ? '#3a3a3a' : '#767676', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {label}
              </span>
            </div>
          </Link>
        );
      })}


    </nav>
  );
}