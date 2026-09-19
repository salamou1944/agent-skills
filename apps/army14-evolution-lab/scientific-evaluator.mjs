import { createHash } from 'node:crypto';

export const RESEARCH_BASIS = Object.freeze({
  continuousEvolution: 'EvoClaw/SWE-CI: evaluate agents across repeated evolution cycles, not isolated patches.',
  regressionControl: 'Long-horizon coding studies show regression accumulation is a primary failure mode.',
  executableFeedback: 'Self-evolving coding-agent research emphasizes executable feedback, repository context, and trajectories.',
  blindVerification: 'Refactor benchmarks show behavioral tests alone can accept changes that did not actually perform the intended migration.',
});

export const METRICS = Object.freeze([
  'correctness','regressionRate','maintainability','verificationCoverage','latencyMs','costProxy','evidenceIndependence'
]);

export function experimentId(input) {
  return 'exp-' + createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0,20);
}

export function scoreExperiment({baseline, candidate, independent=false}) {
  const b=baseline ?? {}, c=candidate ?? {};
  const regressionRate = Number(c.regressed ?? 0) / Math.max(1, Number(c.soldiers ?? 1));
  const baselineRate = Number(b.passRate ?? 0);
  const candidateRate = Number(c.passRate ?? 0);
  const correctness = candidateRate;
  const regressionControl = Math.max(0, 1-regressionRate);
  const maintainability = Math.max(0, Math.min(1, 0.5 + (candidateRate-baselineRate)));
  const verificationCoverage = independent ? 1 : 0;
  const evidenceIndependence = independent ? 1 : 0;
  const latencyMs = Number(c.maxDurationMs ?? 0);
  const latencyScore = latencyMs ? Math.max(0, Math.min(1, 1/(1+latencyMs/60000))) : 1;
  return {
    correctness, regressionControl, maintainability, verificationCoverage,
    evidenceIndependence, latencyMs, latencyScore,
    composite: 0.35*correctness + 0.30*regressionControl + 0.15*maintainability +
      0.10*verificationCoverage + 0.05*evidenceIndependence + 0.05*latencyScore
  };
}

export function verdict({baselineScore,candidateScore,regressed,independent}) {
  if (regressed > 0) return 'REJECT_REGRESSION';
  if (!independent) return 'BLOCK_NEEDS_INDEPENDENT_EVIDENCE';
  if (candidateScore <= baselineScore) return 'REJECT_NO_NET_GAIN';
  return 'ELIGIBLE_FOR_PROMOTION_GATE';
}
