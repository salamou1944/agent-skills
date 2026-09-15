import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';

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
    markers: ['name: failure-recovery-operator', 'description:', 'classify failures', 'blind retries', 'alternate path'],
  },
  {
    name: 'evidence-backed-operator',
    markers: ['name: evidence-backed-operator', 'description:', 'observable evidence', 'planned', 'executed', 'verified'],
  },
  {
    name: 'browser-presence-operator',
    markers: ['name: browser-presence-operator', 'description:', 'browser', 'CAPTCHA', 'MFA', 'bypass'],
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

const forbidden = [
  /bypass authentication/i,
  /bypass CAPTCHA/i,
  /bypass MFA/i,
  /bypass quotas/i,
  /bypass rate limits/i,
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
  for (const pattern of forbidden) {
    if (pattern.test(text)) throw new Error(`${skill.name}: forbidden bypass instruction present: ${pattern}`);
  }
}

console.log(`delegated-operation self-test: PASS (${skills.length} skills)`);
