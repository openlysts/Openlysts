const LOCAL_USER = {
  id: "local-admin",
  name: "Local Admin",
  email: "admin@localhost",
  role: "admin",
  workspace_name: "Local Workspace",
  onboarded: true,
  settings: {
    ping_frequency: "daily",
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    ai_tone: "friendly"
  }
};

let currentUser = { ...LOCAL_USER };
let userCreated = false;

export const auth = {
  async me() {
    // Ensure the user exists in the local DB so relationships work
    if (!userCreated) {
      try {
        const res = await fetch('/api/entities/User/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ where: { id: LOCAL_USER.id } })
        });
        const users = await res.json();
        if (users.length === 0) {
          await fetch('/api/entities/User/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: LOCAL_USER })
          });
        } else {
          currentUser = users[0];
        }
        userCreated = true;
      } catch (e) {
        // ignore in case server is not ready yet
      }
    }
    return currentUser;
  },
  
  async logout() {
    console.log('[Auth] Logged out locally');
  },
  
  async redirectToLogin(redirectUrl) {
    window.location.href = '/';
  },
  
  async updateMe(updates) {
    currentUser = { ...currentUser, ...updates };
    try {
      const res = await fetch(`/api/entities/User/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id, data: updates })
      });
      if (res.ok) {
        currentUser = await res.json();
      }
    } catch (e) {
      console.error('[Auth] Error updating user locally', e);
    }
    return currentUser;
  }
};
