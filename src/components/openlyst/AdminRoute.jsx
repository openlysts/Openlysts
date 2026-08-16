import { useAuth } from '@/lib/AuthContext';
import { localClient } from '@/api/localClient';

export default function AdminRoute({ children }) {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    localClient.auth.redirectToLogin(window.location.href);
    return null;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-text mb-2">Admin Access Required</h1>
        <p className="text-text-muted text-sm">You need an admin account to access this page.</p>
      </div>
    );
  }

  return children;
}