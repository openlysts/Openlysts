// Real Auth Client

export const auth = {
  async me() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch (e) {
      console.error('[Auth Client] Error fetching me:', e);
      return null;
    }
  },
  
  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('[Auth Client] Logout error:', e);
    }
  },
  
  async redirectToLogin(redirectUrl) {
    if (redirectUrl) {
      window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      window.location.href = '/login';
    }
  },
  
  async updateMe(updates) {
    try {
      // Updates are mostly for profile/settings
      const res = await fetch(`/api/profile/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return await this.me(); // refetch user
    } catch (e) {
      console.error('[Auth Client] Error updating user locally', e);
      throw e;
    }
  }
};
