import { db } from '../db/index.js';
import crypto from 'crypto';

const JSON_FIELDS = ['topics', 'categories', 'settings', 'clarifying_questions', 'pros_and_cons'];

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
  if ('archived' in parsed) parsed.archived = !!parsed.archived;
  if ('hidden' in parsed) parsed.hidden = !!parsed.hidden;
  if ('featured' in parsed) parsed.featured = !!parsed.featured;
  if ('created_by_ai' in parsed) parsed.created_by_ai = !!parsed.created_by_ai;
  if ('enabled' in parsed) parsed.enabled = !!parsed.enabled;
  if ('onboarded' in parsed) parsed.onboarded = !!parsed.onboarded;
  return parsed;
}

function stringifyData(data) {
  const result = { ...data };
  for (const field of JSON_FIELDS) {
    if (result[field] !== undefined && typeof result[field] !== 'string') {
      result[field] = JSON.stringify(result[field]);
    }
  }
  if (typeof result.archived === 'boolean') result.archived = result.archived ? 1 : 0;
  if (typeof result.hidden === 'boolean') result.hidden = result.hidden ? 1 : 0;
  if (typeof result.featured === 'boolean') result.featured = result.featured ? 1 : 0;
  if (typeof result.created_by_ai === 'boolean') result.created_by_ai = result.created_by_ai ? 1 : 0;
  if (typeof result.enabled === 'boolean') result.enabled = result.enabled ? 1 : 0;
  if (typeof result.onboarded === 'boolean') result.onboarded = result.onboarded ? 1 : 0;
  return result;
}

export class EntityService {
  constructor(entityName) {
    this.entity = entityName;
  }

  async list(sort = null, limit = null) {
    let orderClause = '';
    if (sort) {
      const isDesc = sort.startsWith('-');
      const field = isDesc ? sort.substring(1) : sort;
      orderClause = `ORDER BY "${field}" ${isDesc ? 'DESC' : 'ASC'}`;
    }
    let limitClause = '';
    if (limit) limitClause = `LIMIT ${parseInt(limit, 10)}`;
    const stmt = db.prepare(`SELECT * FROM "${this.entity}" ${orderClause} ${limitClause}`);
    return stmt.all().map(parseRow);
  }

  async filter(where = {}, sort = null, limit = null) {
    let whereClause = '';
    const params = [];
    if (where && Object.keys(where).length > 0) {
      const conditions = [];
      for (const [key, val] of Object.entries(where)) {
        conditions.push(`"${key}" = ?`);
        params.push(val);
      }
      whereClause = `WHERE ` + conditions.join(' AND ');
    }
    let orderClause = '';
    if (sort) {
      const isDesc = sort.startsWith('-');
      const field = isDesc ? sort.substring(1) : sort;
      orderClause = `ORDER BY "${field}" ${isDesc ? 'DESC' : 'ASC'}`;
    }
    let limitClause = '';
    if (limit) limitClause = `LIMIT ${parseInt(limit, 10)}`;
    const stmt = db.prepare(`SELECT * FROM "${this.entity}" ${whereClause} ${orderClause} ${limitClause}`);
    return stmt.all(...params).map(parseRow);
  }

  async create(data) {
    let payload = { ...data };
    if (!payload.id) payload.id = crypto.randomUUID();
    if (!payload.created_date) payload.created_date = new Date().toISOString();
    payload = stringifyData(payload);
    
    const keys = Object.keys(payload);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => payload[k]);
    
    const stmt = db.prepare(`INSERT INTO "${this.entity}" (${cols}) VALUES (${placeholders})`);
    stmt.run(...values);
    return parseRow(payload);
  }

  async update(id, data) {
    const payload = stringifyData(data);
    const keys = Object.keys(payload);
    if (keys.length === 0) return this.filter({ id }).then(res => res[0]);
    const setClause = keys.map(k => `"${k}" = ?`).join(', ');
    const values = keys.map(k => payload[k]);
    
    const stmt = db.prepare(`UPDATE "${this.entity}" SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
    return this.filter({ id }).then(res => res[0]);
  }

  async delete(id) {
    db.prepare(`DELETE FROM "${this.entity}" WHERE id = ?`).run(id);
    return { success: true };
  }

  async deleteMany(where = {}) {
    const conditions = [];
    const params = [];
    for (const [key, val] of Object.entries(where)) {
      conditions.push(`"${key}" = ?`);
      params.push(val);
    }
    const whereClause = conditions.length > 0 ? `WHERE ` + conditions.join(' AND ') : '';
    db.prepare(`DELETE FROM "${this.entity}" ${whereClause}`).run(...params);
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
    
    const keys = Object.keys(payloadArray[0]);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const insertStmt = db.prepare(`INSERT INTO "${this.entity}" (${cols}) VALUES (${placeholders})`);
    
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        const values = keys.map(k => item[k]);
        insertStmt.run(...values);
      }
    });
    
    insertMany(payloadArray);
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
