import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('@/api/base44Client')) {
    content = content.replace(/@\/api\/base44Client/g, '@/api/localClient');
    changed = true;
  }
  if (content.includes('{ base44 }')) {
    content = content.replace(/\{\s*base44\s*\}/g, '{ localClient }');
    changed = true;
  }
  if (content.includes('base44.')) {
    content = content.replace(/\bbase44\./g, 'localClient.');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
