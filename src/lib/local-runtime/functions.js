export const functions = {
  async invoke(name, params = {}, options = {}) {
    const readOnlyFunctions = [
      'queryRepositories', 'getSimilarRepos', 'queryAlternatives', 
      'getRepoVideos', 'getRepoReadme', 'getRepoHistory'
    ];
    
    let method = 'POST';
    let url = `/api/functions/${name}`;
    let fetchOptions = {
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      signal: options.signal
    };

    if (readOnlyFunctions.includes(name)) {
      method = 'GET';
      const searchParams = new URLSearchParams();
      // Flatten params into query string, stringify objects/arrays
      for (const [key, value] of Object.entries(params)) {
        searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
      fetchOptions.method = method;
      // No body for GET
    } else {
      fetchOptions.method = method;
      fetchOptions.body = JSON.stringify(params);
    }

    const res = await fetch(url, fetchOptions);
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.message || `Failed to invoke function ${name}`);
    }
    return data;
  }
};
