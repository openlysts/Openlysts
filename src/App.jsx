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

// Public Pages
const Welcome = lazyWithRetry(() => import('./pages/Welcome'));
const Home = lazyWithRetry(() => import('./pages/Home'));
const Search = lazyWithRetry(() => import('./pages/Search'));
const RepoDetail = lazyWithRetry(() => import('./pages/RepoDetail'));
const Alternatives = lazyWithRetry(() => import('./pages/Alternatives'));
const Trending = lazyWithRetry(() => import('./pages/Trending'));
const About = lazyWithRetry(() => import('./pages/About'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const Compare = lazyWithRetry(() => import('./pages/Compare'));
const Guide = lazyWithRetry(() => import('./pages/Guide'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));

// Auth Pages
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const VerifyEmail = lazyWithRetry(() => import('./pages/VerifyEmail'));

// Protected Pages
const Bookmarks = lazyWithRetry(() => import('./pages/Bookmarks'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Admin = lazyWithRetry(() => import('./pages/Admin'));

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CompareProvider>
          <MobileLayoutProvider>
            <QueryClientProvider client={queryClientInstance}>
            <Router>
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
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/bookmarks" element={<Bookmarks />} />
                    
                    {/* Protected Routes */}
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                  </Route>
                  <Route path="*" element={<PageNotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </Router>
            <Toaster />
          </QueryClientProvider>
          </MobileLayoutProvider>
        </CompareProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App