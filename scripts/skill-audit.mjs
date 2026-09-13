import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), '.agents', 'skills');
const deficits = [];
let total = 0;
let passed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'SKILL.md') {
      total++;
      const text = fs.readFileSync(full, 'utf8').trim();
      const relative = path.relative(root, full);
      const ok = text.length >= 80 && (/^---\s*\n[\s\S]*?\n---/m.test(text) || text.startsWith('#'));
      if (ok) passed++;
      else deficits.push({ skill: relative, reason: 'missing/insufficient skill contract structure' });
    }
  }
}

walk(root);
console.log(`skill audit: ${passed}/${total} structurally valid`);
if (deficits.length) {
  console.log(JSON.stringify({ deficits }, null, 2));
  process.exitCode = 1;
}
