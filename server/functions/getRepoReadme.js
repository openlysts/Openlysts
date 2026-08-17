export default async function getRepoReadme(req, res) {
  const { fullName, defaultBranch = 'main' } = req.body;
  if (!fullName) {
    return res.status(400).json({ error: true, message: 'Missing fullName' });
  }

  try {
    const url = `https://api.github.com/repos/${fullName}/readme`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'Openlyst-App'
      }
    });

    if (response.ok) {
      const readme = await response.text();
      return res.json({ readme });
    }

    if (response.status === 404) {
      return res.json({ readme: null });
    }

    // Rate limit (403) or other errors: fallback to raw.githubusercontent.com
    console.warn(`[getRepoReadme] GitHub API failed (${response.status}) for ${fullName}, falling back to raw...`);
    const possibleNames = ['README.md', 'README.mdx', 'README.rst', 'README.txt', 'readme.md', 'README'];
    
    for (const file of possibleNames) {
      const rawUrl = `https://raw.githubusercontent.com/${fullName}/${defaultBranch}/${file}`;
      const rawRes = await fetch(rawUrl);
      if (rawRes.ok) {
        const readme = await rawRes.text();
        return res.json({ readme });
      }
    }

    return res.json({ readme: null });
  } catch (err) {
    console.error('[getRepoReadme] Error:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch README' });
  }
}
