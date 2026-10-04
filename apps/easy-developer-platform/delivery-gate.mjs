#!/usr/bin/env node

import { assertTaskVerified } from './task-result-gate.mjs';
import { assertIndependentEvidence } from './independent-evidence-gate.mjs';

export const DELIVERY_GATE_VERSION = '1.0.0';

export function evaluateDelivery(result, { allowNoop = true, requireIndependent = true } = {}) {
  try {
    assertTaskVerified(result, { allowNoop });
    assertIndependentEvidence(result, { requireIndependent });
    return {
      status: 'DELIVERY_ALLOWED',
      gateVersion: DELIVERY_GATE_VERSION,
      taskStatus: result.status,
    };
  } catch (error) {
    return {
      status: 'DELIVERY_BLOCKED',
      gateVersion: DELIVERY_GATE_VERSION,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export function assertDeliveryAllowed(result, options) {
  const decision = evaluateDelivery(result, options);
  if (decision.status !== 'DELIVERY_ALLOWED') {
    throw new Error('delivery_gate_rejected:' + decision.reason);
  }
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
    process.stdout.write(JSON.stringify(evaluateDelivery(result)) + '\n');
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    process.exit(1);
  }
}
