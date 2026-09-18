import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SOLDIERS = Object.freeze([
  ['01','architect'],['02','builder'],['03','ui-ux'],['04','backend-api'],['05','database'],
  ['06','security'],['07','integration'],['08','ai-agent'],['09','test-qa'],['10','browser-e2e'],
  ['11','debug-repair'],['12','deployment-ops'],['13','product-mvp'],['14','research-capability'],
]);

const ALLOWED = /\.(mjs|js|cjs|json|md|yml|yaml|ts|tsx)$/i;
const FORBIDDEN = /(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|secrets?(?:\/|\.)|credentials?(?:\/|\.))/i;

export function mutationId(input) {
  return 'mutation-' + createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 16);
}

export function validateMutationPlan(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('mutation_plan_invalid');
  if (typeof plan.hypothesis !== 'string' || plan.hypothesis.trim().length < 12) throw new Error('mutation_hypothesis_required');
  if (!Array.isArray(plan.changes) || plan.changes.length === 0 || plan.changes.length > 12) throw new Error('mutation_changes_invalid');
  const paths = new Set();
  for (const change of plan.changes) {
    if (!change || typeof change.path !== 'string' || paths.has(change.path)) throw new Error('mutation_duplicate_or_invalid_path');
    if (change.path.startsWith('/') || change.path.includes('..') || !ALLOWED.test(change.path) || FORBIDDEN.test(change.path)) {
      throw new Error('mutation_unsafe_path:' + change.path);
    }
    if (change.path.startsWith('.github/workflows/')) throw new Error('mutation_workflow_forbidden');
    if (typeof change.content !== 'string' || change.content.length > 200000) throw new Error('mutation_content_invalid:' + change.path);
    paths.add(change.path);
  }
  if (plan.target && !SOLDIERS.some(([id]) => plan.target.startsWith(id + '-'))) throw new Error('mutation_target_unknown');
  return true;
}

export async function inspectSoldier(root, id, name) {
  const path = `.github/agents/${id}-${name}-soldier.agent.md`;
  const source = await readFile(join(root, path), 'utf8');
  const signals = {
    advancedUpgrade: /## Advanced upgrade/i.test(source),
    verification: /verification|evidence/i.test(source),
    resilience: /recovery|resilience|rollback/i.test(source),
    executionLoop: /## Execution loop/i.test(source),
    qualityBar: /## Quality bar/i.test(source),
  };
  const gaps = Object.entries(signals).filter(([,ok]) => !ok).map(([key]) => key);
  return { soldier: id + '-' + name, path, signals, gaps };
}

export async function buildMutationSeed(root, soldierId, rationale='') {
  const found = SOLDIERS.find(([id]) => id === soldierId);
  if (!found) throw new Error('soldier_unknown:' + soldierId);
  const inspection = await inspectSoldier(root, ...found);
  return {
    mutation: mutationId({soldier: inspection.soldier, gaps: inspection.gaps, rationale}),
    target: inspection.soldier,
    hypothesis: rationale || 'Improve the soldier contract while preserving existing verification and recovery guarantees.',
    observedGaps: inspection.gaps,
    constraints: {
      maxFiles: 12,
      forbiddenWorkflowEdits: true,
      forbiddenSensitivePaths: true,
      promotionRequiresIndependentVerification: true,
    },
  };
}
