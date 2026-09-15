import { readFile, access } from 'node:fs/promises';

const root = new URL('../.agents/skills/', import.meta.url);
const skills = [
  {
    name: 'delegated-user-operator',
    markers: ['name: delegated-user-operator', 'description:', 'Parse the goal', 'Inspect available tools', 'Execute authorized reversible steps', 'Verify each material result independently', 'Record evidence', 'Delegation is not impersonation'],
  },
  {
    name: 'permission-aware-executor',
    markers: ['name: permission-aware-executor', 'description:', 'permissions', 'write access', 'Never infer write access'],
  },
  {
    name: 'action-approval-gate',
    markers: ['name: action-approval-gate', 'description:', 'AUTO', 'CONFIRM', 'BLOCK', 'irreversible'],
  },
  {
    name: 'persistent-task-operator',
    markers: ['name: persistent-task-operator', 'description:', 'goal', 'current_state', 'evidence', 'blockers', 'next_action'],
  },
  {
    name: 'failure-recovery-operator',
    markers: ['name: failure-recovery-operator', 'description:', 'Classify it as', 'blind retries', 'alternate path'],
  },
  {
    name: 'evidence-backed-operator',
    markers: ['name: evidence-backed-operator', 'description:', 'observable evidence', 'PLANNED', 'EXECUTED', 'VERIFIED', 'FAILED', 'BLOCKED'],
  },
  {
    name: 'browser-presence-operator',
    markers: ['name: browser-presence-operator', 'description:', 'browser', 'CAPTCHA', 'MFA', 'rather than bypassing'],
  },
  {
    name: 'user-preference-executor',
    markers: ['name: user-preference-executor', 'description:', 'explicit user operating rules', 'constraints'],
  },
  {
    name: 'operating-memory-bridge',
    markers: ['name: operating-memory-bridge', 'description:', 'operating memory', 'rules', 'evidence', 'secrets'],
  },
];

const unsafeImperatives = [
  /(?:^|\n)\s*(?:[-*]\s*)?(?:always\s+)?bypass\s+authentication\b/i,
  /(?:^|\n)\s*(?:[-*]\s*)?(?:always\s+)?bypass\s+CAPTCHA\b/i,
  /(?:^|\n)\s*(?:[-*]\s*)?(?:always\s+)?bypass\s+MFA\b/i,
  /(?:^|\n)\s*(?:[-*]\s*)?(?:always\s+)?bypass\s+quotas\b/i,
  /(?:^|\n)\s*(?:[-*]\s*)?(?:always\s+)?bypass\s+rate\s+limits\b/i,
];

for (const skill of skills) {
  const file = new URL(`${skill.name}/SKILL.md`, root);
  await access(file);
  const text = await readFile(file, 'utf8');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) throw new Error(`${skill.name}: missing YAML frontmatter`);
  if (!new RegExp(`^name:\\s*${skill.name}\\s*$`, 'm').test(frontmatter[1])) {
    throw new Error(`${skill.name}: invalid skill name`);
  }
  if (!/^description:\s*.+$/m.test(frontmatter[1])) {
    throw new Error(`${skill.name}: missing skill description`);
  }
  for (const marker of skill.markers) {
    if (!text.includes(marker)) throw new Error(`${skill.name}: missing required contract marker: ${marker}`);
  }
  for (const pattern of unsafeImperatives) {
    if (pattern.test(text)) throw new Error(`${skill.name}: unsafe bypass imperative present: ${pattern}`);
  }
}

console.log(`delegated-operation self-test: PASS (${skills.length} skills)`);
