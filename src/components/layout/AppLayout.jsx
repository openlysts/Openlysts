import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TabletNav from "./TabletNav";
import MobileNav from "./MobileNav";
import LogoIcon from "./LogoIcon";
import { ChevronLeft, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { localClient } from "@/api/localClient";

const PAGE_LABELS = {
  '/': null,
  '/goals': 'Goals',
  '/my-tasks': 'My Tasks',
  '/activity': 'Agent Activity',
  '/team': 'Team',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isHome = location.pathname === '/';
  const isInnerPage = !isHome;
  const pageLabel = 'Dashboard';
  const glowDesktopRef = useRef(null);
  const glowTabletRef = useRef(null);
  const glowMobileRef = useRef(null);
  const posRef = useRef({ x: 50, y: 50 });
  const currentRef = useRef({ x: 50, y: 50 });
  const rafRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      posRef.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
    };

    const animate = () => {
      const target = posRef.current;
      const curr = currentRef.current;
      curr.x += (target.x - curr.x) * 0.04;
      curr.y += (target.y - curr.y) * 0.04;
      const bg = `radial-gradient(circle 600px at ${curr.x}% ${curr.y}%, rgba(201,179,245,0.35) 0%, transparent 70%)`;
      if (glowDesktopRef.current) glowDesktopRef.current.style.background = bg;
      if (glowTabletRef.current) glowTabletRef.current.style.background = bg;
      if (glowMobileRef.current) glowMobileRef.current.style.background = bg;
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* ── Desktop layout (≥1024px) ── */}
      <div
        className="hidden lg:flex h-screen"
        style={{ background: '#ebe7e2', padding: '24px', gap: '24px', position: 'relative', overflow: 'hidden' }}
      >
        <div ref={glowDesktopRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, transition: 'none' }} />
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 min-w-0" style={{ padding: '0 0 24px 0', overflowY: 'auto', overflowX: 'visible', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* ── Tablet layout (768px – 1023px) ── */}
      <div
        className="hidden md:block lg:hidden"
        style={{ background: '#ebe7e2', position: 'relative' }}
      >
        <div ref={glowTabletRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, transition: 'none' }} />
        {isInnerPage && (
          <div style={{ position: 'relative', zIndex: 2, padding: '18px 20px 0 20px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#eeeae6',
                boxShadow: '-3px -3px 7px rgba(255,250,244,0.78), 3px 3px 8px rgba(160,143,126,0.22)',
                border: 'none',
                borderRadius: 10,
                padding: '7px 14px 7px 10px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: '#6e6e6e',
                letterSpacing: '0.01em',
                transition: 'box-shadow 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '-5px -5px 10px rgba(255,250,244,0.9), 5px 5px 12px rgba(160,143,126,0.32)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '-3px -3px 7px rgba(255,250,244,0.78), 3px 3px 8px rgba(160,143,126,0.22)'; }}
            >
              <ChevronLeft style={{ width: 15, height: 15, strokeWidth: 1.8, color: '#9a9a9a' }} />
              {pageLabel}
            </button>
          </div>
        )}
        <main style={{ position: 'relative', zIndex: 1, padding: isInnerPage ? '12px 20px 100px 20px' : '24px 20px 100px 20px' }}>
          <Outlet />
        </main>
        <TabletNav />
      </div>

      {/* ── Mobile layout (<768px) ── */}
      <div
        className="flex md:hidden flex-col"
        style={{ background: '#ebe7e2', minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}
      >
        <div ref={glowMobileRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, transition: 'none' }} />
        {/* Mobile top header */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#eeeae6',
          boxShadow: '0 4px 16px rgba(160,143,126,0.18)',
          borderRadius: '0 0 20px 20px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoIcon size={9} />
            <span style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: '#2f2823',
              textTransform: 'uppercase',
            }}>
              ORBITAL
            </span>
          </div>
          {user ? (
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setMobileMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 12px', borderRadius: 10, cursor: 'pointer',
                  background: '#ebe7e2',
                  boxShadow: 'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: '#FFCBDE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#5a5350' }}>
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#6e6e6e', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name || user.email}
                </span>
              </div>
              {mobileMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setMobileMenuOpen(false)} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                    background: '#eeeae6',
                    boxShadow: '-6px -6px 12px rgba(255,250,244,0.78), 6px 6px 14px rgba(160,143,126,0.31)',
                    borderRadius: 12, overflow: 'hidden', minWidth: 140,
                  }}>
                    <button
                      onClick={() => { localClient.auth.logout(); setMobileMenuOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontSize: 13, color: '#BD3228', fontWeight: 500,
                      }}
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
              onClick={() => localClient.auth.redirectToLogin(window.location.href)}
              style={{
                background: '#ebe7e2',
                boxShadow: '-3px -3px 6px rgba(255,250,244,0.78), 3px 3px 6px rgba(160,143,126,0.22)',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                padding: '6px 14px',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#3a3a3a',
              }}
            >
              Log In
            </button>
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, padding: '16px 6px 90px 6px' }}>
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </>
  );
}