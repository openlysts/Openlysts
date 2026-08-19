import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { User, Mail, Shield, AlertCircle, CheckCircle2, Lock, Trash2, Github, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout, authChecked, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [providers, setProviders] = useState([]);
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      navigate('/login');
    } else if (user) {
      setName(user.name || '');
      fetchProviders();
    }
  }, [user, authChecked, isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/discover');
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/profile/providers', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.error('Failed to load providers', e);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/profile/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      
      setStatus({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      
      setStatus({ type: 'success', message: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!window.confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    
    try {
      const res = await fetch(`/api/profile/providers/${provider}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to disconnect');
      
      setStatus({ type: 'success', message: `${provider} disconnected.` });
      fetchProviders();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;
    
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        logout(true);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.message || 'Failed to delete account' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {status.message && (
        <div className={`mb-6 p-4 rounded-md flex items-start ${status.type === 'error' ? 'bg-red-900/50 border border-red-500 text-red-200' : 'bg-green-900/50 border border-green-500 text-green-200'}`}>
          {status.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />}
          <span>{status.message}</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Profile Section */}
        <div className="bg-[#1a1a1a] shadow overflow-hidden sm:rounded-lg border border-[#333]">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-white flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </h3>
          </div>
          <div className="border-t border-[#333] px-4 py-5 sm:p-6">
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300">Email (Cannot be changed)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="mt-1 bg-[#222] border-[#444] text-gray-500 block w-full shadow-sm sm:text-sm border rounded-md p-2 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 bg-[#222] border-[#444] text-white block w-full shadow-sm sm:text-sm border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-[#1a1a1a] shadow overflow-hidden sm:rounded-lg border border-[#333]">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-white flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Change Password
            </h3>
          </div>
          <div className="border-t border-[#333] px-4 py-5 sm:p-6">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 bg-[#222] border-[#444] text-white block w-full shadow-sm sm:text-sm border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 bg-[#222] border-[#444] text-white block w-full shadow-sm sm:text-sm border rounded-md p-2"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-[#1a1a1a] shadow overflow-hidden sm:rounded-lg border border-[#333]">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-white flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Connected Accounts
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-400">Manage your connected social login providers.</p>
          </div>
          <div className="border-t border-[#333] px-4 py-5 sm:p-6">
            <ul className="divide-y divide-[#333]">
              {providers.map((p) => (
                <li key={p.provider} className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {p.provider === 'google' ? (
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    ) : (
                      <Github className="w-5 h-5 mr-3 text-white" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{p.provider}</p>
                      <p className="text-xs text-gray-500">{p.provider_email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(p.provider)}
                    className="text-sm font-medium text-red-500 hover:text-red-400"
                  >
                    Disconnect
                  </button>
                </li>
              ))}
              {providers.length === 0 && (
                <li className="py-4 text-sm text-gray-500">No external accounts connected.</li>
              )}
            </ul>
            
            <div className="mt-4 flex gap-3">
               {!providers.find(p => p.provider === 'google') && (
                 <a href="/api/auth/google?redirect=/profile" className="text-sm text-blue-500 hover:text-blue-400 font-medium">
                   + Connect Google
                 </a>
               )}
               {!providers.find(p => p.provider === 'github') && (
                 <a href="/api/auth/github?redirect=/profile" className="text-sm text-blue-500 hover:text-blue-400 font-medium">
                   + Connect GitHub
                 </a>
               )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/10 shadow overflow-hidden sm:rounded-lg border border-red-900/50 mt-12">
          <div className="px-4 py-5 sm:p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-red-500 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Account
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Permanently remove your account and all associated data.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="inline-flex justify-center py-2 px-4 border border-red-900 shadow-sm text-sm font-medium rounded-md text-red-500 bg-red-900/20 hover:bg-red-900/40"
            >
              Delete Account
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
