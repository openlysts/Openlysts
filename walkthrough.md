
### Admin Role Reset Bug Root Cause

**Finding:** The backend code does NOT reset the role on login. The database retains the updated 'admin' role correctly, and the /api/auth/me endpoint returns it accurately.

**The Issue:** The bug was entirely on the Frontend due to **HTTP Disk Caching** (specifically in Safari/Chrome). When logging out and logging back into an account that had its role updated in a different tab or earlier session, the browser intercepted the GET /api/auth/me request and served a stale 200 OK response from its disk cache containing ole: 'user' because cache-control headers were not explicitly disabled on the endpoint.

**The Fix:** Added strict Cache-Control: no-store, no-cache, must-revalidate, private headers to /api/auth/me in server/api/auth.js and in the etch options inside AuthContext.jsx. This forces the browser to re-fetch the role directly from the Neon database on every login, guaranteeing synchronization.
