#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = '.agents/skills';
const findings = [];

async function walk(dir) {
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) await walk(p);
    else if (name.name === 'SKILL.md') {
      const text = await readFile(p, 'utf8');
      if (!text.startsWith('---\n')) findings.push(`${p}: missing YAML frontmatter`);
      const end = text.indexOf('\n---', 4);
      const front = end >= 0 ? text.slice(4, end) : '';
      if (!/^name:\s*[a-z0-9-]+$/m.test(front)) findings.push(`${p}: invalid/missing name`);
      if (!/^description:\s*.+$/m.test(front)) findings.push(`${p}: missing description`);
      if (/\b(ignore|bypass|disable)\b.{0,80}\bsecurity|reveal\s+(api|secret|token)|send\s+.*(secret|credential)/i.test(text)) {
        findings.push(`${p}: review suspicious security/credential instruction`);
      }
    }
  }
}

await walk(root);
if (findings.length) {
  console.error(findings.join('\n'));
  process.exit(1);
}
console.log('Skill metadata/security baseline passed.');
