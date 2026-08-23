import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { checkUserAuth } = useAuth();

  useEffect(() => {
    const verifyToken = async () => {
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Verification failed');
        }
        
        // Success: update global auth state (auto-login happens on backend)
        await checkUserAuth();
        
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/discover');
        }, 3000);
        
      } catch (err) {
        setStatus('error');
        setMessage(err.message);
      }
    };

    verifyToken();
  }, [location, navigate, checkUserAuth]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-card/90 backdrop-blur-xl py-12 px-6 shadow-2xl rounded-3xl border border-border sm:px-10 text-center">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <h2 className="text-xl font-bold text-text mb-2">Verifying your email...</h2>
              <p className="text-sm text-text-muted">Please wait a moment.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold text-text mb-2">Verification Successful</h2>
              <p className="text-sm text-text-secondary mb-6">{message}</p>
              <p className="text-xs text-text-muted">Redirecting you to the app...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle className="h-12 w-12 text-nonoss mb-4" />
              <h2 className="text-xl font-bold text-text mb-2">Verification Failed</h2>
              <p className="text-sm text-text-secondary mb-6">{message}</p>
              
              <Link
                to="/login"
                className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl shadow-md text-sm font-bold text-accent-fg bg-accent hover:bg-accent/90 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
