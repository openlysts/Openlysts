import fs from 'fs';
import path from 'path';

function stripComments(jsonc) {
  return jsonc.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
}

const mapType = (propDef) => {
  if (propDef.type === 'integer' || propDef.type === 'boolean') return 'INTEGER';
  if (propDef.type === 'number') return 'REAL';
  return 'TEXT'; // string, array, object
};

const entitiesDir = path.join(process.cwd(), 'base44/entities');
const files = fs.readdirSync(entitiesDir).filter(f => f.endsWith('.jsonc'));

let schemaCode = `export function initSchema(db) {\n`;

for (const file of files) {
  const content = fs.readFileSync(path.join(entitiesDir, file), 'utf-8');
  const json = JSON.parse(stripComments(content));
  const tableName = json.name;
  
  let createStmt = `  db.exec(\`\n    CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  createStmt += `      id TEXT PRIMARY KEY,\n`;
  createStmt += `      created_date TEXT,\n`;
  
  for (const [propName, propDef] of Object.entries(json.properties || {})) {
    const type = mapType(propDef);
    createStmt += `      ${propName} ${type},\n`;
  }
  
  createStmt = createStmt.slice(0, -2) + `\n    );\n  \`);\n\n`;
  schemaCode += createStmt;
}

schemaCode += `}\n`;

const outDir = path.join(process.cwd(), 'server', 'db');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(path.join(outDir, 'schema.js'), schemaCode);
console.log('Schema written successfully to server/db/schema.js');
