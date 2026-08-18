import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data', 'openlyst.db');

export async function cleanupUnusedSpace() {
    console.log(`Connecting to DB at: ${dbPath}`);
    const db = new Database(dbPath);
    
    const requiredTables = [
        'Repository', 'Alternative', 'IngestionRun', 
        'MetricSnapshot', 'User', 'Invitation', 'DiscoveryQuery'
    ];
    
    const allTables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    
    let droppedCount = 0;
    
    for (const table of allTables) {
        if (!requiredTables.includes(table.name) && table.name !== 'sqlite_sequence') {
            console.log(`Dropping legacy unused table to save space: ${table.name}`);
            db.exec(`DROP TABLE IF EXISTS "${table.name}"`);
            droppedCount++;
        }
    }
    
    if (droppedCount > 0) {
        console.log('Running VACUUM to reclaim disk space...');
        db.exec('VACUUM;');
        console.log('VACUUM complete. Wasted space reclaimed.');
    } else {
        console.log('No unused tables found. DB is clean.');
    }
    
    db.close();
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    cleanupUnusedSpace().catch(console.error);
}
