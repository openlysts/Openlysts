const http = require('http');

async function checkApi() {
  for (let i = 1; i <= 10; i++) {
    const start = Date.now();
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3001/api/functions/queryRepositories?sort=trending&page=1', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
      });
      const elapsed = Date.now() - start;
      console.log(\Request \: \ms (\ results)\);
    } catch (e) {
      console.log(\Request \ ERROR: \\);
    }
  }
}

checkApi();
