import fs from 'fs';
import path from 'path';

const skillPath = path.join(process.cwd(), '.agents/skills/openlyst-qa-tester/SKILL.md');
const content = fs.readFileSync(skillPath, 'utf8');

const regex = /###\s*(TC-[^\n\r:]+):?([^\n\r]*)/g;
let match;
const testCases = [];

while ((match = regex.exec(content)) !== null) {
  testCases.push({
    id: match[1].trim(),
    title: match[2].trim()
  });
}

console.log(`Found ${testCases.length} test cases in SKILL.md:`);
console.log(`First: ${testCases[0]?.id} - ${testCases[0]?.title}`);
console.log(`Last: ${testCases[testCases.length - 1]?.id} - ${testCases[testCases.length - 1]?.title}`);

// List in batches of 20
for (let i = 0; i < testCases.length; i += 20) {
  const batch = testCases.slice(i, i + 20).map(t => t.id).join(', ');
  console.log(`[Batch ${Math.floor(i / 20) + 1}]: ${batch}`);
}
