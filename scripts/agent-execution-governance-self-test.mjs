import { readFile } from 'node:fs/promises';

const path = new URL('../skills/agent-execution-governance/SKILL.md', import.meta.url);
const text = await readFile(path, 'utf8');

const required = [
  'name: agent-execution-governance',
  'description:',
  'DISCOVER',
  'INSPECT',
  'PLAN',
  'CLASSIFY AUTHORITY',
  'AUTHORIZE',
  'EXECUTE',
  'VERIFY',
  'PERSIST EVIDENCE',
  'RECOVER/REPLAN',
  'least privilege',
  'Require explicit approval',
  'Independent verification',
  'Completion gate',
  'VERIFIED',
  'IMPLEMENTED_NOT_FULLY_VERIFIED',
  'merged_from:',
  'agent-operator',
  'execution-operating-layer',
  'mcp-tool-safety',
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

const frontmatter = text.match(/^---\n([\\s\\S]*?)\n---\n/);
if (!frontmatter) throw new Error('missing YAML frontmatter');
if (!/^name:\s*agent-execution-governance\s*$/m.test(frontmatter[1])) {
  throw new Error('invalid skill name');
}
if (!/^description:\s*.+$/m.test(frontmatter[1])) {
  throw new Error('missing skill description');
}

console.log('agent-execution-governance self-test: PASS');
