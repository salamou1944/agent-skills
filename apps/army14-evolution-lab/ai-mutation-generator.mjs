import { mkdir, writeFile } from 'node:fs/promises';
import { ask } from '../easy-developer-platform/autonomous-coder.mjs';
import { validateMutationPlan, mutationId } from './mutation-engine.mjs';

const SYSTEM_RULES = [
  'Generate a software mutation plan, not prose.',
  'Use repository evidence and the supplied research hypothesis.',
  'Prefer one mutation family and the smallest safe change set.',
  'Never modify .github/workflows, credentials, secrets, deployment policy, or authentication policy.',
  'Never modify evaluator/test files used as independent judges.',
  'Return JSON only with summary, hypothesis, target, expectedDelta, falsifier, changes.',
];

export async function generateAIMutation({ hypothesis, context, evaluatorFiles = [], target = null, providerConfig = {} } = {}) {
  if (!hypothesis?.id) throw new Error('hypothesis_required');
  const prompt = [SYSTEM_RULES.join(' '), `Hypothesis: ${JSON.stringify(hypothesis)}`, `Target: ${target || 'repository'}`, `Evaluator files (immutable): ${JSON.stringify(evaluatorFiles)}`, `Repository evidence: ${JSON.stringify(context || {})}`, 'Return a bounded candidate whose changes contain complete file contents.'].join('\n');
  const raw = await ask(prompt, providerConfig);
  const plan = {...raw, hypothesis:String(raw?.hypothesis || hypothesis.hypothesis), target:raw?.target || target || undefined, expectedDelta:raw?.expectedDelta || hypothesis.expected, falsifier:raw?.falsifier || hypothesis.falsifier, changes:Array.isArray(raw?.changes) ? raw.changes : []};
  if (plan.changes.some(c => evaluatorFiles.includes(c.path))) throw new Error('independent_evaluator_tampering');
  validateMutationPlan(plan);
  return { id: mutationId({hypothesis:hypothesis.id, changes:plan.changes}), plan };
}

export async function persistAIMutation(result, path='.lab/results/ai-mutation.json') {
  await mkdir('.lab/results', { recursive:true });
  await writeFile(path, JSON.stringify({schema:'army14-evolution-lab/ai-mutation/v1',...result}, null, 2));
  return path;
}

if (import.meta.url === `file://${process.argv[1]}`) { console.error('Use generateAIMutation from the controlled experiment runner.'); process.exit(2); }