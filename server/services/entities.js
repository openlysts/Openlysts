import { db } from '../db/index.js';
import crypto from 'crypto';
import { getCatalogRepositories, getCatalogAlternatives } from './catalogEngine.js';

const JSON_FIELDS = ['topics', 'categories', 'settings', 'clarifying_questions', 'pros_and_cons'];

function sanitizeIdentifier(name) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return name;
}

function parseRow(row) {
  if (!row) return row;
  const parsed = { ...row };
  for (const field of JSON_FIELDS) {
    if (typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // ignore
      }
    }
  }
  const boolFields = ['archived', 'hidden', 'featured', 'created_by_ai', 'enabled', 'onboarded', 'staff_pick'];
  for (const f of boolFields) {
    if (f in parsed) {
      parsed[f] = (parsed[f] === 1 || parsed[f] === '1' || parsed[f] === true || parsed[f] === 'true');
    }
  }
  return parsed;
}

function stringifyData(data) {
  const result = { ...data };
  for (const field of JSON_FIELDS) {
    if (result[field] !== undefined && typeof result[field] !== 'string') {
      result[field] = JSON.stringify(result[field]);
    }
  }
  const boolFields = ['archived', 'hidden', 'featured', 'created_by_ai', 'enabled', 'onboarded', 'staff_pick'];
  for (const f of boolFields) {
    if (result[f] !== undefined) {
      result[f] = (result[f] === true || result[f] === 'true' || result[f] === 1 || result[f] === '1') ? 1 : 0;
    }
  }
  return result;
}

export class EntityService {
  constructor(entityName) {
    this.entity = sanitizeIdentifier(entityName);
  }

  getColumnList() {
    if (this.entity === 'Repository') {
      return 'id, created_date, github_id, full_name, owner, name, description, html_url, homepage_url, default_branch, language, license_key, license_name, license_url, license_status, stars, forks, open_issues, watchers, topics, categories, github_created_at, github_updated_at, last_ingested_at, archived, hidden, featured, quality_score, trending_score, stars_gained_24h, stars_gained_7d, stars_gained_30d, difficulty, engagement_score, authority_score, staff_pick, openlysts_score_boost, updated_at, tags';
    }
    return '*';
  }

  async list(sort = null, limit = null) {
    if (this.entity === 'Repository') {
      let repos = [...getCatalogRepositories()];
      if (sort) {
        const isDesc = sort.startsWith('-');
        const field = isDesc ? sort.substring(1) : sort;
        repos.sort((a, b) => {
          const valA = a[field] || 0;
          const valB = b[field] || 0;
          return isDesc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
        });
      }
      if (limit) repos = repos.slice(0, parseInt(limit, 10));
      return repos;
    }
    if (this.entity === 'Alternative') {
      let alts = [...getCatalogAlternatives()];
      if (limit) alts = alts.slice(0, parseInt(limit, 10));
      return alts;
    }

    try {
      let orderClause = '';
      if (sort) {
        const isDesc = sort.startsWith('-');
        const rawField = isDesc ? sort.substring(1) : sort;
        const field = sanitizeIdentifier(rawField);
        orderClause = `ORDER BY "${field}" ${isDesc ? 'DESC' : 'ASC'}`;
      }
      let limitClause = '';
      if (limit) limitClause = `LIMIT ${parseInt(limit, 10)}`;
      const { rows } = await db.query(`SELECT ${this.getColumnList()} FROM "${this.entity}" ${orderClause} ${limitClause}`);
      return rows.map(parseRow);
    } catch (err) {
      console.error(`[ENTITY LIST] DB error for ${this.entity}:`, err.message);
      return [];
    }
  }

  async filter(where = {}, sort = null, limit = null) {
    try {
      let whereClause = '';
      const params = [];
      if (where && Object.keys(where).length > 0) {
        const conditions = [];
        for (const [key, val] of Object.entries(where)) {
          const safeKey = sanitizeIdentifier(key);
          params.push(val);
          if (typeof val === 'string' && (safeKey === 'full_name' || safeKey === 'name' || safeKey === 'owner' || safeKey === 'email')) {
            conditions.push(`LOWER("${safeKey}") = LOWER($${params.length})`);
          } else {
            conditions.push(`"${safeKey}" = $${params.length}`);
          }
        }
        whereClause = `WHERE ` + conditions.join(' AND ');
      }
      let orderClause = '';
      if (sort) {
        const isDesc = sort.startsWith('-');
        const rawField = isDesc ? sort.substring(1) : sort;
        const field = sanitizeIdentifier(rawField);
        orderClause = `ORDER BY "${field}" ${isDesc ? 'DESC' : 'ASC'}`;
      }
      let limitClause = '';
      if (limit) limitClause = `LIMIT ${parseInt(limit, 10)}`;
      const { rows } = await db.query(`SELECT ${this.getColumnList()} FROM "${this.entity}" ${whereClause} ${orderClause} ${limitClause}`, params);
      if (rows.length === 0 && (this.entity === 'Repository' || this.entity === 'Alternative')) {
        throw new Error('Fallback to static catalog because table is empty for this query');
      }
      return rows.map(parseRow);
    } catch (err) {
      if (this.entity === 'Repository') {
        const repos = getCatalogRepositories();
        let filtered = repos.filter(r => {
          for (const [k, v] of Object.entries(where)) {
            if (typeof v === 'string') {
              if ((r[k] || '').toLowerCase() !== v.toLowerCase()) return false;
            } else if (r[k] !== v) {
              return false;
            }
          }
          return true;
        });
        if (sort) {
          const isDesc = sort.startsWith('-');
          const field = isDesc ? sort.substring(1) : sort;
          filtered.sort((a, b) => {
            const valA = a[field] || 0;
            const valB = b[field] || 0;
            return isDesc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
          });
        }
        if (limit) filtered = filtered.slice(0, parseInt(limit, 10));
        return filtered;
      }
      if (this.entity === 'Alternative') {
        const alts = getCatalogAlternatives();
        let filtered = alts.filter(a => {
          for (const [k, v] of Object.entries(where)) {
            if (typeof v === 'string') {
              if ((a[k] || '').toLowerCase() !== v.toLowerCase()) return false;
            } else if (a[k] !== v) {
              return false;
            }
          }
          return true;
        });
        if (limit) filtered = filtered.slice(0, parseInt(limit, 10));
        return filtered;
      }
      return [];
    }
  }

  async create(data) {
    let payload = { ...data };
    if (!payload.id) payload.id = crypto.randomUUID();
    if (!payload.created_date) payload.created_date = new Date().toISOString();
    payload = stringifyData(payload);
    
    const keys = Object.keys(payload).map(sanitizeIdentifier);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => payload[k]);
    
    await db.query(`INSERT INTO "${this.entity}" (${cols}) VALUES (${placeholders})`, values);
    return parseRow(payload);
  }

  async update(id, data) {
    const payload = stringifyData(data);
    const keys = Object.keys(payload).map(sanitizeIdentifier);
    if (keys.length === 0) return this.filter({ id }).then(res => res[0]);
    const values = keys.map(k => payload[k]);
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    values.push(id);
    
    await db.query(`UPDATE "${this.entity}" SET ${setClause} WHERE id = $${values.length}`, values);
    return this.filter({ id }).then(res => res[0]);
  }

  async delete(id) {
    await db.query(`DELETE FROM "${this.entity}" WHERE id = $1`, [id]);
    return { success: true };
  }

  async deleteMany(where = {}) {
    const conditions = [];
    const params = [];
    for (const [key, val] of Object.entries(where)) {
      const safeKey = sanitizeIdentifier(key);
      params.push(val);
      conditions.push(`"${safeKey}" = $${params.length}`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ` + conditions.join(' AND ') : '';
    if (whereClause) {
      await db.query(`DELETE FROM "${this.entity}" ${whereClause}`, params);
    } else {
      await db.query(`DELETE FROM "${this.entity}"`);
    }
    return { success: true };
  }

  async bulkCreate(dataArray) {
    const payloadArray = dataArray.map(item => {
      let cloned = { ...item };
      if (!cloned.id) cloned.id = crypto.randomUUID();
      if (!cloned.created_date) cloned.created_date = new Date().toISOString();
      return stringifyData(cloned);
    });
    
    if (payloadArray.length === 0) return [];
    
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const keys = Object.keys(payloadArray[0]).map(sanitizeIdentifier);
      const cols = keys.map(k => `"${k}"`).join(', ');
      
      let allValues = [];
      let placeholders = [];
      let i = 1;
      for (const item of payloadArray) {
        let rowPlaceholders = [];
        for (const k of keys) {
           rowPlaceholders.push(`$${i++}`);
           allValues.push(item[k]);
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      }
      
      const queryStr = `INSERT INTO "${this.entity}" (${cols}) VALUES ${placeholders.join(', ')}`;
      await client.query(queryStr, allValues);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return payloadArray.map(parseRow);
  }

  async bulkUpsert(dataArray) {
    const payloadArray = dataArray.map(item => {
      let cloned = { ...item };
      if (!cloned.id) cloned.id = crypto.randomUUID();
      if (!cloned.created_date) cloned.created_date = new Date().toISOString();
      return stringifyData(cloned);
    });
    
    if (payloadArray.length === 0) return [];
    
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      let keys = Object.keys(payloadArray[0]).map(sanitizeIdentifier);
      const allowedCols = this.getColumnList();
      if (allowedCols !== '*') {
        const allowedSet = new Set(allowedCols.split(',').map(s => s.trim()));
        keys = keys.filter(k => allowedSet.has(k));
      }
      
      const cols = keys.map(k => `"${k}"`).join(', ');
      
      let allValues = [];
      let placeholders = [];
      let i = 1;
      for (const item of payloadArray) {
        let rowPlaceholders = [];
        for (const k of keys) {
           rowPlaceholders.push(`$${i++}`);
           allValues.push(item[k]);
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      }
      
      const updateSet = keys.filter(k => k !== 'id' && k !== 'created_date').map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
      const whereDistinctClause = keys.filter(k => k !== 'id' && k !== 'created_date').map(k => `"${this.entity}"."${k}" IS DISTINCT FROM EXCLUDED."${k}"`).join(' OR ');
      const queryStr = `INSERT INTO "${this.entity}" (${cols}) VALUES ${placeholders.join(', ')} ON CONFLICT (id) DO UPDATE SET ${updateSet} ${whereDistinctClause ? 'WHERE ' + whereDistinctClause : ''}`;

      await client.query(queryStr, allValues);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return payloadArray.map(parseRow);
  }
}

export const entities = {
  Repository: new EntityService('Repository'),
  Goal: new EntityService('Goal'),
  Task: new EntityService('Task'),
  User: new EntityService('User'),
  Agent: new EntityService('Agent'),
  AgentActivity: new EntityService('AgentActivity'),
  IngestionRun: new EntityService('IngestionRun'),
  MetricSnapshot: new EntityService('MetricSnapshot'),
  DiscoveryQuery: new EntityService('DiscoveryQuery'),
  Ping: new EntityService('Ping'),
  Update: new EntityService('Update'),
  Invitation: new EntityService('Invitation'),
  Alternative: new EntityService('Alternative')
};
