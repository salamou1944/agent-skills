#!/usr/bin/env node
import { createHash } from 'node:crypto';

export const REPAIR_STAGES = Object.freeze([
  'detect','inspect','reproduce','root_cause','patch','regression','verify','persist'
]);

const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function classifyFailure(error = {}) {
  const code = String(error.code || 'unknown');
  const message = String(error.message || error.reason || '');
  const external = /provider_(quota_exhausted|http_429|http_5\\d\\d|timeout)|network|egress|subscription|resource_limit|rate_limit|external_dependency/i.test(`${code} ${message}`);
  const security = /security|auth|credential|secret|permission|protected_path/i.test(`${code} ${message}`);
  const test = /test_failed|regression|assert|syntax_failed/i.test(`${code} ${message}`);
  const config = /config|environment|missing.*variable/i.test(`${code} ${message}`);
  const kind = external ? 'external' : security ? 'security-review' : test ? 'test' : config ? 'config' : 'code';
  return { kind, code, message: message.slice(0, 2000), blocker: external ? 'BLOCKED_EXTERNAL_DEPENDENCY' : null };
}

export function stageEvidence(stage, payload = {}, parentHashes = []) {
  if (!REPAIR_STAGES.includes(stage)) throw new Error(`invalid_repair_stage:${stage}`);
  return {
    stage,
    evidenceId: `${stage}:${hash({ stage, payload, parentHashes }).slice(0, 16)}`,
    payload,
    parentHashes: [...new Set(parentHashes)].sort(),
    generatedAt: new Date().toISOString()
  };
}

export function assertStageEvidence(evidence, expectedStage) {
  if (!evidence || evidence.stage !== expectedStage || !evidence.evidenceId) {
    throw new Error(`missing_stage_evidence:${expectedStage}`);
  }
  return evidence;
}

export function buildRepairContext({ goal, failure, previousPlan, inspectContext, attempt }) {
  const classification = classifyFailure(failure);
  return {
    goal,
    attempt,
    classification,
    previousPlanHash: hash(previousPlan || {}),
    inspectContextHash: hash(inspectContext || ''),
    instruction: 'Produce the smallest materially different repair hypothesis. Do not convert external blockers into success.'
  };
}
