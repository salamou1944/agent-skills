#!/usr/bin/env node

const TASK_VERIFIED = new Set(['VERIFIED', 'TASK_VERIFIED', 'VERIFIED_NOOP', 'NOOP_VERIFIED']);
const PIPELINE_ONLY = new Set(['PIPELINE_VERIFIED', 'VERIFIED_PRACTICAL_FALLBACK']);

export function classifyResult(result) {
  const status = String(result?.status || '').trim();
  if (TASK_VERIFIED.has(status)) return { taskVerified: true, pipelineVerified: true, status };
  if (PIPELINE_ONLY.has(status)) return { taskVerified: false, pipelineVerified: true, status };
  return { taskVerified: false, pipelineVerified: false, status: status || 'UNKNOWN' };
}

export function assertTaskVerified(result, { allowNoop = true } = {}) {
  const classified = classifyResult(result);
  if (!classified.pipelineVerified) throw new Error(`elite_result_not_verified:${classified.status}`);
  if (!classified.taskVerified) throw new Error(`elite_task_not_proven:${classified.status}`);
  if (!allowNoop && ['VERIFIED_NOOP', 'NOOP_VERIFIED'].includes(classified.status)) {
    throw new Error('elite_noop_not_allowed');
  }
  return result;
}

export function assertPipelineVerified(result) {
  const classified = classifyResult(result);
  if (!classified.pipelineVerified) throw new Error(`elite_pipeline_not_verified:${classified.status}`);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = process.env.RESULT_JSON || process.argv.slice(2).join(' ').trim();
  if (!raw) {
    console.error('result_required');
    process.exit(2);
  }
  try {
    const result = JSON.parse(raw);
    const mode = process.env.GATE_MODE || 'task';
    const checked = mode === 'pipeline' ? assertPipelineVerified(result) : assertTaskVerified(result);
    process.stdout.write(JSON.stringify({ ok: true, classification: classifyResult(checked) }) + '\n');
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    process.exit(1);
  }
}
