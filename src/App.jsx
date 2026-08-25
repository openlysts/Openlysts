import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/theme';
import { MobileLayoutProvider } from '@/lib/MobileLayoutContext';
import { CompareProvider } from '@/lib/CompareContext';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

import OpenlystLayout from './components/openlyst/OpenlystLayout';
import AdminRoute from './components/openlyst/AdminRoute';
import ProtectedRoute from './components/openlyst/ProtectedRoute';
import ErrorBoundary from './components/openlyst/ErrorBoundary';
import EasterEggsOverlay from './components/openlyst/EasterEggsOverlay';
import ScrollToTop from './components/openlyst/ScrollToTop';

// Auto-recover if Vite detects a missing preloaded chunk during/after a live deployment
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Preload error detected for chunk, refreshing application:', event);
    event.preventDefault();
    window.location.reload();
  });
}

// Public Pages
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Search from './pages/Search';
import RepoDetail from './pages/RepoDetail';
import Alternatives from './pages/Alternatives';
import Trending from './pages/Trending';
import About from './pages/About';
import Contact from './pages/Contact';
import Compare from './pages/Compare';
import Guide from './pages/Guide';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// Protected Pages
import Bookmarks from './pages/Bookmarks';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <ThemeProvider>
            <CompareProvider>
              <MobileLayoutProvider>
                <ScrollToTop />
                <ErrorBoundary>
                  <EasterEggsOverlay />
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}>
                    <Routes>
                      <Route path="/" element={<Welcome />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      
                      <Route element={<OpenlystLayout />}>
                        <Route path="/discover" element={<Home />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/repo/:owner/:name" element={<RepoDetail />} />
                        <Route path="/alternatives" element={<Alternatives />} />
                        <Route path="/trending" element={<Trending />} />
                        <Route path="/guide" element={<Guide />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
                        <Route path="/manifesto" element={<Navigate to="/about" replace />} />
                        <Route path="/bookmarks" element={<Bookmarks />} />
                        
                        {/* Protected Routes */}
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                        
                        {/* 404 Route inside layout */}
                        <Route path="*" element={<PageNotFound />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
                <Toaster />
              </MobileLayoutProvider>
            </CompareProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App