import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid or missing reset token.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <h1 className="text-3xl font-black text-text tracking-tight">
          Create new password
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-card/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-border sm:px-10">
          {success ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold text-text mb-2">Password reset successful</h2>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl shadow-md text-sm font-bold text-accent-fg bg-accent hover:bg-accent/90 transition-colors"
              >
                Sign in
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-nonoss-soft border border-nonoss/30 rounded-xl p-3 flex items-start text-xs font-medium text-nonoss">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    New password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                      type="password"
                      required
                      disabled={!token}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="bg-bg border border-border text-text block w-full pl-10 sm:text-sm rounded-xl p-2.5 focus:border-accent focus:outline-none transition-colors placeholder:text-text-muted disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Must be at least 8 characters.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    Confirm new password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                      type="password"
                      required
                      disabled={!token}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="bg-bg border border-border text-text block w-full pl-10 sm:text-sm rounded-xl p-2.5 focus:border-accent focus:outline-none transition-colors placeholder:text-text-muted disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !token}
                    className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-md text-sm font-bold text-accent-fg bg-accent hover:bg-accent/90 focus:outline-none disabled:opacity-50 transition-all"
                  >
                    {isLoading ? 'Resetting...' : 'Reset password'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
