import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from '@/lib/theme';
import { MobileLayoutProvider } from '@/lib/MobileLayoutContext';

import OpenlystLayout from './components/openlyst/OpenlystLayout';
import AdminRoute from './components/openlyst/AdminRoute';
import ErrorBoundary from './components/openlyst/ErrorBoundary';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Search from './pages/Search';
import RepoDetail from './pages/RepoDetail';
import Alternatives from './pages/Alternatives';
import Trending from './pages/Trending';
import Bookmarks from './pages/Bookmarks';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Compare from './pages/Compare';

function AuthGate({ children }) {
  const { isLoadingPublicSettings, isLoadingAuth, authError, navigateToLogin } = useAuth();
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }
  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MobileLayoutProvider>
          <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthGate>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route element={<OpenlystLayout />}>
                  <Route path="/discover" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/repo/:owner/:name" element={<RepoDetail />} />
                  <Route path="/alternatives" element={<Alternatives />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                </Route>
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </ErrorBoundary>
            </AuthGate>
          </Router>
          <Toaster />
        </QueryClientProvider>
        </MobileLayoutProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App