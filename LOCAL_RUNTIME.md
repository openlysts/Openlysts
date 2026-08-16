# Local Runtime Architecture

This document describes the new standalone local backend for Openlyst.

## Architecture

The application has been migrated from a Base44-hosted backend to a local Express API with a SQLite database.
- **Frontend**: React/Vite application. The `@base44/sdk` has been replaced with a compatibility layer in `src/lib/local-runtime/` that provides the exact same programmatic API (e.g., `base44.entities`, `base44.auth`, `base44.functions`) but routes requests to the local Express backend.
- **Backend**: Express API running on port 3001 (proxied via Vite). Found in the `server/` directory.
- **Database**: `better-sqlite3` storing data in `data/openlyst.db`.

## Getting Started

To run the application locally:
1. Ensure dependencies are installed: `npm install`
2. Add a `.env.local` file with your `GITHUB_TOKEN` for the ingestion functions.
3. Start the dev server: `npm run dev`
This uses `concurrently` to run both the Vite dev server and the Express API server at the same time.

## Database

The database is powered by SQLite.

### Seeding & Resetting
- **Reset**: Run `npm run db:reset` to delete the `data/openlyst.db` database entirely. On the next start, the tables will be automatically recreated.
- **Initialization**: The schema is automatically initialized when the backend starts up (via `server/db/schema.js`).

### Modifying Schema
To add new tables or indices, edit `server/db/schema.js`. The next time you start the backend, it will execute the updated `CREATE TABLE IF NOT EXISTS` statements. If you modify existing columns, you may need to reset the database (`npm run db:reset`) because SQLite doesn't automatically migrate existing table structures without `ALTER TABLE` commands.

## Functions

All backend functions from Base44 have been ported to `server/functions/*.js`.

### Adding a New Function
1. Create a new file in `server/functions/` (e.g., `myNewFunction.js`).
2. Export a default asynchronous function that takes `(req, res)` as arguments:
   ```js
   import { entities } from '../services/entities.js';
   export default async function myNewFunction(req, res) {
     try {
       // logic here
       return res.json({ success: true });
     } catch (err) {
       return res.status(500).json({ error: true, message: err.message });
     }
   }
   ```
3. Register the function in `server/api/functions.js` by importing it and adding it to the `fns` map.
4. The frontend can now invoke it using `await base44.functions.invoke('myNewFunction', { params })`.

## Entities

The `server/api/entities.js` provides a generic CRUD router mapped to SQLite.
- `base44.entities.Model.list()`
- `base44.entities.Model.filter()`
- `base44.entities.Model.create()`
- `base44.entities.Model.update()`
- `base44.entities.Model.delete()`
- `base44.entities.Model.deleteMany()`
- `base44.entities.Model.bulkCreate()`

JSON fields like `topics` and `categories` are automatically stringified on write and parsed on read by the `EntityService`.
