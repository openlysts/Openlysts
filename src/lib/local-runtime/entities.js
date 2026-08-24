export class EntityClient {
  constructor(entityName) {
    this.entity = entityName;
  }

  async _request(action, body) {
    const res = await fetch(`/api/entities/${this.entity}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.message || `Failed to ${action} ${this.entity}`);
    }
    return data;
  }

  async list(sort = null, limit = null) {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);
    const qs = params.toString();
    const res = await fetch(`/api/entities/${this.entity}/list${qs ? '?' + qs : ''}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.message || `Failed to list ${this.entity}`);
    return data;
  }

  async filter(where = {}, sort = null, limit = null) {
    const params = new URLSearchParams();
    if (where && Object.keys(where).length > 0) params.append('where', JSON.stringify(where));
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);
    const qs = params.toString();
    const res = await fetch(`/api/entities/${this.entity}/filter${qs ? '?' + qs : ''}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.message || `Failed to filter ${this.entity}`);
    return data;
  }

  async create(data) {
    return this._request('create', { data });
  }

  async update(id, data) {
    return this._request('update', { id, data });
  }

  async delete(id) {
    return this._request('delete', { id });
  }

  async deleteMany(where = {}) {
    return this._request('deleteMany', { where });
  }

  async bulkCreate(data) {
    return this._request('bulkCreate', { data });
  }
}

export const entities = {
  Repository: new EntityClient('Repository'),
  Goal: new EntityClient('Goal'),
  Task: new EntityClient('Task'),
  User: new EntityClient('User'),
  Agent: new EntityClient('Agent'),
  AgentActivity: new EntityClient('AgentActivity'),
  IngestionRun: new EntityClient('IngestionRun'),
  MetricSnapshot: new EntityClient('MetricSnapshot'),
  DiscoveryQuery: new EntityClient('DiscoveryQuery'),
  Ping: new EntityClient('Ping'),
  Update: new EntityClient('Update'),
  Invitation: new EntityClient('Invitation')
};
