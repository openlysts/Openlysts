import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { fetchAccountBookmarks, mergeAccountBookmarkIds } from '@/lib/bookmarks';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const res = await fetch('/api/auth/me', {
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
      });
      if (!res.ok) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        // Merge the account's bookmarks into the local list so the Saved
        // page and header badge reflect them on sign-in (best-effort).
        fetchAccountBookmarks().then((rows) => {
          if (rows) mergeAccountBookmarkIds(rows.map((r) => r.repository_id));
        }).catch(() => {});
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('[AuthContext] Network error checking auth:', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('[AuthContext] Logout error:', e);
    }
    setUser(null);
    setIsAuthenticated(false);
    // Let session-scoped local state (compare tray, etc.) reset on sign-out
    window.dispatchEvent(new CustomEvent('openlysts:clear-local-state'));
  }, []);

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      isLoadingAuth,
      authChecked,
      logout,
      checkUserAuth,
      refreshUser: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
