const http = require('http');

async function testLeak() {
  console.log('Testing /api/functions/queryAlternatives 50 times...');
  for(let i=0; i<50; i++) {
    await new Promise((resolve) => {
      http.get('http://localhost:5173/api/functions/queryAlternatives?q=react', (res) => {
        res.resume();
        res.on('end', resolve);
      });
    });
  }
  console.log('Done queryAlternatives');

  console.log('Testing /api/functions/queryRepositories 50 times...');
  for(let i=0; i<50; i++) {
    await new Promise((resolve) => {
      http.get('http://localhost:5173/api/functions/queryRepositories?q=react', (res) => {
        res.resume();
        res.on('end', resolve);
      });
    });
  }
  console.log('Done queryRepositories');
}

testLeak();
