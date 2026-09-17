#!/usr/bin/env node

const SCENARIOS = Object.freeze(['provider_429','provider_timeout','provider_5xx','duplicate_request','branch_disappears','merge_conflict','invalid_artifact','deployment_failure']);

export async function runChaosScenarios({ execute, verify, scenarios = SCENARIOS } = {}) {
  if (typeof execute !== 'function' || typeof verify !== 'function') throw new Error('chaos_hooks_required');
  const results = [];
  for (const scenario of scenarios) {
    try {
      const failure = await execute(scenario);
      const recovered = failure?.recovered === true || failure?.status === 'RECOVERED';
      const verification = recovered ? await verify(scenario, failure) : { ok:false, reason:'recovery_not_proven' };
      results.push({ scenario, recovered, verified:verification.ok === true, verification });
    } catch (error) {
      results.push({ scenario, recovered:false, verified:false, error:error.message });
    }
  }
  return { status: results.every(x => x.recovered && x.verified) ? 'CHAOS_VERIFIED' : 'CHAOS_FAILED', scenarios:results };
}

export { SCENARIOS };
