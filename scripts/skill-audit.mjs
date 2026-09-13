import fs from 'node:fs';
import path from 'node:path';

const roots = ['.agents/skills', 'skills'].filter((p) => fs.existsSync(p));
const deficits = [];
let total = 0;
let passed = 0;

function walk(dir, root) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root);
    else if (entry.name === 'SKILL.md') {
      total++;
      const text = fs.readFileSync(full, 'utf8').trim();
      const relative = path.relative(process.cwd(), full);
      const frontmatter = /^---\s*\n[\s\S]*?\n---/m.test(text);
      const heading = /^#\s+/m.test(text);
      const operational = /(must|should|steps?|contract|validation|test|verify|evidence|failure)/i.test(text);
      const ok = text.length >= 120 && (frontmatter || heading) && operational;
      if (ok) passed++;
      else deficits.push({ skill: relative, reason: 'skill contract is missing executable/validation-oriented guidance' });
    }
  }
}

for (const root of roots) walk(root, root);
const report = { total, passed, failed: deficits.length, deficits };
console.log(`skill audit: ${passed}/${total} operationally structured`);
console.log(JSON.stringify(report, null, 2));
if (deficits.length) process.exitCode = 1;
