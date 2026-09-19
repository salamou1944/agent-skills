import { createHash } from 'node:crypto';

const PRINCIPLES = Object.freeze([
  { id:'P1', name:'continuous-evolution', source:'SWE-CI/EvoClaw', focus:'preserve integrity across repeated changes' },
  { id:'P2', name:'regression-first', source:'EvoClaw', focus:'reject error accumulation before optimizing gains' },
  { id:'P3', name:'executable-feedback', source:'Self-Evolving Coding Agents', focus:'turn trajectories and tests into reusable evidence' },
  { id:'P4', name:'blind-verification', source:'refactor-verification research', focus:'prevent the candidate from changing its own judge' },
  { id:'P5', name:'harness-invariance', source:'benchmark methodology', focus:'hold evaluator/scaffolding stable while comparing candidates' }
]);

function idOf(value){ return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,16); }

export function generateHypotheses({ soldiers=[], regressions=0, observations=[] }={}) {
  const weak = soldiers.filter(s => Number(s.score ?? s.passRate ?? 0) < 1).map(s => s.id ?? s.name).filter(Boolean);
  const out = [
    { kind:'verification', target:weak, hypothesis:'Independent evidence and blind evaluation can reduce false-positive promotion.', expected:'verificationCoverage increases without increasing regressions', falsifier:'candidate changes evaluator inputs or independent checks fail' },
    { kind:'resilience', target:weak, hypothesis:'Recovery behavior can be improved by preserving failure context and retry boundaries.', expected:'same failure class resolves with fewer repeated attempts', falsifier:'retry amplification or new failure modes appear' },
    { kind:'maintainability', target:weak, hypothesis:'Smaller, isolated mutations reduce long-horizon regression propagation.', expected:'regressionRate decreases at equal correctness', falsifier:'correctness falls or cross-soldier coupling increases' },
    { kind:'feedback', target:weak, hypothesis:'Persisting failure signatures as reusable constraints improves the next experiment.', expected:'repeat experiment avoids the previous failure signature', falsifier:'same signature recurs without new explanatory evidence' }
  ];
  return out.map(h=>({...h, evidence:{regressions, observations}, principle:PRINCIPLES.find(p=>p.focus.includes(h.kind==='verification'?'judge':h.kind==='resilience'?'repeated':h.kind==='feedback'?'trajectories':'integrity'))?.id ?? 'P2', id:idOf(h)}));
}
export { PRINCIPLES };
