async function run() {
  for (let i = 0; i < 5; i++) {
    const res = await Promise.all([
      fetch('http://localhost:3001/api/functions/getGlobalStats').then(r => r.json()),
      fetch('http://localhost:3001/api/functions/queryRepositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort: 'trending', page: 1 })
      }).then(r => r.json()),
      fetch('http://localhost:3001/api/functions/queryRepositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort: 'recent', page: 1 })
      }).then(r => r.json()),
      fetch('http://localhost:3001/api/functions/queryRepositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: ['ai'], sort: 'stars', page: 1 })
      }).then(r => r.json())
    ]);
    console.log(`Run ${i + 1}: Global: ${res[0].totalRepositories}, Trending: ${res[1].total}, Recent: ${res[2].total}, AI: ${res[3].total}`);
  }
}

run();
