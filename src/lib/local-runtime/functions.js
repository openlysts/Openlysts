export const functions = {
  async invoke(name, params = {}) {
    const res = await fetch(`/api/functions/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.message || `Failed to invoke function ${name}`);
    }
    return data;
  }
};
