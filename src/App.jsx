import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/theme';
import { MobileLayoutProvider } from '@/lib/MobileLayoutContext';
import { CompareProvider } from '@/lib/CompareContext';

import OpenlystLayout from './components/openlyst/OpenlystLayout';
import AdminRoute from './components/openlyst/AdminRoute';
import ProtectedRoute from './components/openlyst/ProtectedRoute';
import ErrorBoundary from './components/openlyst/ErrorBoundary';

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
    <AuthProvider>
      <ThemeProvider>
        <CompareProvider>
          <MobileLayoutProvider>
            <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ErrorBoundary>
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
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/bookmarks" element={<Bookmarks />} />
                    
                    {/* Protected Routes */}
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                  </Route>
                  <Route path="*" element={<PageNotFound />} />
                </Routes>
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