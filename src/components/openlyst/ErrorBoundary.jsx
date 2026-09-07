import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { reportError } from '@/lib/errorTracker';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Report to backend error tracker (best-effort, rate-limited)
    try {
      reportError({
        message: error?.message || 'React component error',
        stack: error?.stack,
        source: 'react',
        component: this.props.name || 'ErrorBoundary',
      });
    } catch {
      /* never let tracking break the fallback UI */
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg px-4">
          <div className="max-w-md w-full bg-bg-card border border-border rounded-xl p-6 text-center shadow-xl">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
            <p className="text-text-secondary text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent text-accent-fg font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
