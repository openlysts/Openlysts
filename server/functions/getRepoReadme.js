const GITHUB_REPO_REGEX = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
const GIT_BRANCH_REGEX = /^[a-zA-Z0-9/_.-]+$/;

export default async function getRepoReadme(req, res) {
  const fullName = req.query?.fullName || req.body?.fullName || '';
  const defaultBranch = req.query?.defaultBranch || req.body?.defaultBranch || 'main';
  if (!fullName || !GITHUB_REPO_REGEX.test(fullName)) {
    return res.status(400).json({ error: true, message: 'Valid fullName (owner/repo) is required' });
  }
  if (!GIT_BRANCH_REGEX.test(defaultBranch) || defaultBranch.includes('..')) {
    return res.status(400).json({ error: true, message: 'Invalid defaultBranch reference' });
  }

  try {
    const url = `https://api.github.com/repos/${fullName}/readme`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'Openlysts-App'
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
    
    const branches = Array.from(new Set([defaultBranch, 'main', 'master', 'trunk']));

    for (const branch of branches) {
      for (const file of possibleNames) {
        const rawUrl = `https://raw.githubusercontent.com/${fullName}/${branch}/${file}`;
        try {
          const rawRes = await fetch(rawUrl);
          if (rawRes.ok) {
            const readme = await rawRes.text();
            return res.json({ readme });
          }
        } catch (e) {
          // ignore network errors for individual fallback URLs
        }
      }
    }

    return res.json({ readme: null });
  } catch (err) {
    console.error('[getRepoReadme] Error:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch README' });
  }
}
