import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export default async function updateConfig(req, res) {
  const { githubToken } = req.body;

  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    
    let envContent = '';
    if (existsSync(envPath)) {
      envContent = await fs.readFile(envPath, 'utf8');
    }

    // Parse and update token
    const lines = envContent.split('\n');
    let found = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('GITHUB_TOKEN=')) {
        lines[i] = `GITHUB_TOKEN=${githubToken || ''}`;
        found = true;
        break;
      }
    }

    if (!found && githubToken) {
      lines.push(`GITHUB_TOKEN=${githubToken}`);
    }

    const newContent = lines.join('\n').trim() + '\n';
    await fs.writeFile(envPath, newContent);

    // Update in-memory
    if (githubToken) {
      process.env.GITHUB_TOKEN = githubToken;
    } else {
      delete process.env.GITHUB_TOKEN;
    }

    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('[API] updateConfig error:', error);
    res.status(500).json({ error: true, message: 'Failed to update config file' });
  }
}
