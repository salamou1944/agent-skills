import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const roots = ['.agents/skills', 'skills'].filter((p) => fs.existsSync(p));
const deficits = [];
let total = 0;
let passed = 0;

function changedSkills() {
  try {
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      return new Set(execFileSync('git', ['diff', '--name-only', 'HEAD^1', 'HEAD'], { encoding: 'utf8' })
        .split('\n').filter((x) => x.endsWith('/SKILL.md')));
    }
  } catch {}
  return null;
}
const scope = changedSkills();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'SKILL.md') {
      const relative = path.relative(process.cwd(), full);
      if (scope && scope.size && !scope.has(relative)) continue;
      total++;
      const text = fs.readFileSync(full, 'utf8').trim();
      const frontmatter = /^---\s*\n[\s\S]*?\n---/m.test(text);
      const heading = /^#\s+/m.test(text);
      const operational = /(must|should|steps?|contract|validation|test|verify|evidence|failure)/i.test(text);
      const ok = text.length >= 120 && (frontmatter || heading) && operational;
      if (ok) passed++;
      else deficits.push({ skill: relative, reason: 'skill contract is missing executable/validation-oriented guidance' });
    }
  }
}

for (const root of roots) walk(root);
const report = { scope: scope ? 'changed-skills' : 'all-skills', total, passed, failed: deficits.length, deficits };
console.log(`skill audit: ${passed}/${total} operationally structured (${report.scope})`);
console.log(JSON.stringify(report, null, 2));
if (deficits.length) process.exitCode = 1;
