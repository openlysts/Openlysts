import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/password/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      // We always show success to prevent email enumeration,
      // but if there's a hard network error we catch it.
      if (!res.ok && data.error) {
        throw new Error(data.message || 'Request failed');
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
          Reset password
        </h1>
        <p className="text-sm text-text-muted mt-1.5">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-card/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-border sm:px-10">
          {success ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold text-text mb-2">Check your email</h2>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                If an account exists for <strong className="text-text">{email}</strong>, we have sent a password reset link.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-accent-fg bg-accent hover:bg-accent/90 transition-colors"
              >
                Return to login
              </Link>
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
                    Email address
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="bg-bg border border-border text-text block w-full pl-10 sm:text-sm rounded-xl p-2.5 focus:border-accent focus:outline-none transition-colors placeholder:text-text-muted"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-md text-sm font-bold text-accent-fg bg-accent hover:bg-accent/90 focus:outline-none disabled:opacity-50 transition-all"
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>
                
                <div className="text-center pt-2">
                  <Link to="/login" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-text transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
