---
name: backend-api-integration
description: "Rules and boilerplate for creating real-world backend API endpoints in Openlyst and wiring them to the frontend without using mocks."
---

# Backend API Integration Protocol

Openlyst strictly prohibits the use of dummy data, `setTimeout` mocks, or fake API responses in production. When a frontend component requires external data (like YouTube tutorials, web scraping, or heavy database queries), you must implement a real Node.js Express backend function.

## 1. Create the Backend Function
Create a new file in `server/functions/`. Write a robust Express middleware function that handles the logic.

```javascript
// server/functions/exampleFunction.js
export default async function exampleFunction(req, res) {
  const { param1 } = req.body;
  if (!param1) return res.status(400).json({ error: true, message: 'Missing param1' });
  
  try {
    // 1. Perform REAL work here (database queries, yt-search, fetch external APIs, etc)
    const result = { data: 'real world data' };
    
    // 2. Return JSON
    res.json(result);
  } catch (err) {
    console.error('[exampleFunction] Error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
}
```

## 2. Register the Route
Add the new function to `server/api/functions.js` so it becomes accessible via `POST /api/functions/exampleFunction`.

```javascript
// server/api/functions.js
import exampleFunction from '../functions/exampleFunction.js';
// ...
const fns = {
  // ... existing functions
  exampleFunction
};
```

## 3. Consume in the Frontend
Update `src/lib/api.js` to invoke the backend using the local client.

```javascript
// src/lib/api.js
import { localClient } from '@/api/localClient';

export async function exampleFunction(params) {
  const res = await localClient.functions.invoke('exampleFunction', params);
  return res;
}
```

## 4. In-Memory & Persistent Disk Caching
For expensive external API requests (such as YouTube searches or web scraping), implement a multi-tier cache pattern combining persistent JSON disk cache (`server/data/*.json`) with in-memory Maps and frontend hover prefetching:

```javascript
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.resolve(__dirname, '../data/video_cache.json');
const memoryCache = new Map();

// Load persistent disk cache on startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    for (const [k, v] of Object.entries(raw)) memoryCache.set(k, v);
  }
} catch (e) {}

export default async function getFastExternalData(req, res) {
  const { key } = req.query;
  const cached = memoryCache.get(key);
  if (cached) return res.json({ data: cached, cached: true });

  const fresh = await fetchExternalData(key);
  memoryCache.set(key, fresh);
  setTimeout(() => fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(memoryCache))), 100);
  return res.json({ data: fresh, cached: false });
}
```

> [!CAUTION]
> **NEVER** write frontend-only mock implementations. Always build the full pipeline from the frontend to a real backend handler with proper in-memory caching and database persistence.


