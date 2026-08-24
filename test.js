import * as cheerio from 'cheerio';
fetch('https://openalternative.co/parlant')
  .then(r => r.text())
  .then(t => {
    const $ = cheerio.load(t);
    const githubLink = $('a[href*="github.com"]').attr('href');
    let githubRepo = null;
    if (githubLink) {
        const match = githubLink.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            githubRepo = `${match[1]}/${match[2]}`;
        }
    }
    const title = $('title').text();
    let alternatives = [];
    if (title.includes('Alternative to')) {
        const altText = title.split('Alternative to')[1].trim();
        alternatives = altText.split(', ').flatMap(s => s.split(' and ')).map(s => s.trim());
    }
    
    console.log({
        githubRepo,
        alternatives
    });
  });
