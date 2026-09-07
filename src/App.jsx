import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/theme';
import { MobileLayoutProvider } from '@/lib/MobileLayoutContext';
import { CompareProvider } from '@/lib/CompareContext';
import { importWithRetry } from '@/lib/lazyWithRetry';

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
const Welcome = lazy(() => importWithRetry(() => import('./pages/Welcome')));
const Home = lazy(() => importWithRetry(() => import('./pages/Home')));
const Search = lazy(() => importWithRetry(() => import('./pages/Search')));
const RepoDetail = lazy(() => importWithRetry(() => import('./pages/RepoDetail')));
const Alternatives = lazy(() => importWithRetry(() => import('./pages/Alternatives')));
const Trending = lazy(() => importWithRetry(() => import('./pages/Trending')));
const About = lazy(() => importWithRetry(() => import('./pages/About')));
const Contact = lazy(() => importWithRetry(() => import('./pages/Contact')));
const Compare = lazy(() => importWithRetry(() => import('./pages/Compare')));
const Guide = lazy(() => importWithRetry(() => import('./pages/Guide')));
const PrivacyPolicy = lazy(() => importWithRetry(() => import('./pages/PrivacyPolicy')));
const TermsOfService = lazy(() => importWithRetry(() => import('./pages/TermsOfService')));
const CookiePolicy = lazy(() => importWithRetry(() => import('./pages/CookiePolicy')));
const Collections = lazy(() => importWithRetry(() => import('./pages/Collections')));

// Auth Pages
const Login = lazy(() => importWithRetry(() => import('./pages/Login')));
const Register = lazy(() => importWithRetry(() => import('./pages/Register')));
const ForgotPassword = lazy(() => importWithRetry(() => import('./pages/ForgotPassword')));
const ResetPassword = lazy(() => importWithRetry(() => import('./pages/ResetPassword')));
const VerifyEmail = lazy(() => importWithRetry(() => import('./pages/VerifyEmail')));

// Protected Pages
const Bookmarks = lazy(() => importWithRetry(() => import('./pages/Bookmarks')));
const Settings = lazy(() => importWithRetry(() => import('./pages/Settings')));
const Profile = lazy(() => importWithRetry(() => import('./pages/Profile')));
const Admin = lazy(() => importWithRetry(() => import('./pages/Admin')));

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* reducedMotion="user" disables framer-motion JS animations (motion.div whileHover/whileTap/AnimatePresence)
          for users with prefers-reduced-motion: reduce — CSS media queries cannot stop JS-driven animations */}
      <MotionConfig reducedMotion="user">
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
                        <Route path="/collections" element={<Collections />} />
                        <Route path="/guide" element={<Guide />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
                        <Route path="/cookie-policy" element={<CookiePolicy />} />
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
      </MotionConfig>
    </Router>
  );
}

export default App