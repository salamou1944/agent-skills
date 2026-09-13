import { readFile } from 'node:fs/promises';

const path = new URL('../skills/agent-operator/SKILL.md', import.meta.url);
const text = await readFile(path, 'utf8');

const required = [
  'name: agent-operator',
  'description:',
  'Understand',
  'Inspect',
  'Plan',
  'Implement',
  'Validate',
  'Recover',
  'Evidence',
  'Report',
  'Never fabricate test results',
  'Completion gate',
  'verified',
  'implemented but not fully verified',
];

for (const marker of required) {
  if (!text.includes(marker)) {
    throw new Error(`missing required contract marker: ${marker}`);
  }
}

const forbidden = [
  'claim success without evidence',
  'skip validation',
];

for (const marker of forbidden) {
  if (text.includes(marker)) {
    throw new Error(`unsafe contract marker present: ${marker}`);
  }
}

const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
if (!frontmatter) throw new Error('missing YAML frontmatter');
if (!/^name:\s*agent-operator\s*$/m.test(frontmatter[1])) {
  throw new Error('invalid skill name');
}
if (!/^description:\s*.+$/m.test(frontmatter[1])) {
  throw new Error('missing skill description');
}

console.log('agent-operator self-test: PASS');
