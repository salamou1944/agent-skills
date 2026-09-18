import { readFile, writeFile } from 'node:fs/promises';

const baseline = JSON.parse(await readFile('.lab/results/baseline.json','utf8'));
const candidate = JSON.parse(await readFile('.lab/results/candidate.json','utf8'));

const key = (r) => r.soldier;
const bySoldier = (report) => {
  const m = new Map();
  for (const r of report.results) {
    const current = m.get(key(r)) ?? { soldier:r.soldier, scores:[], durations:[] };
    current.scores.push(r.score);
    current.durations.push(r.targetDurationMs);
    m.set(key(r), current);
  }
  return m;
};

const b = bySoldier(baseline);
const c = bySoldier(candidate);
const soldiers = [...new Set([...b.keys(), ...c.keys()])].sort();

const rows = soldiers.map((soldier) => {
  const br=b.get(soldier) ?? {scores:[],durations:[]};
  const cr=c.get(soldier) ?? {scores:[],durations:[]};
  const before = br.scores.length ? br.scores.reduce((a,x)=>a+x,0)/br.scores.length : 0;
  const after = cr.scores.length ? cr.scores.reduce((a,x)=>a+x,0)/cr.scores.length : 0;
  const beforeMs = br.durations.length ? Math.max(...br.durations) : null;
  const afterMs = cr.durations.length ? Math.max(...cr.durations) : null;
  const delta = after-before;
  return {
    soldier, before, after, delta,
    status: delta>0 ? 'IMPROVED' : delta<0 ? 'REGRESSED' : 'UNCHANGED',
    maxDurationBeforeMs:beforeMs, maxDurationAfterMs:afterMs,
    durationDeltaMs: beforeMs===null||afterMs===null ? null : afterMs-beforeMs,
  };
});

const improved=rows.filter(r=>r.delta>0).length;
const regressed=rows.filter(r=>r.delta<0).length;
const unchanged=rows.filter(r=>r.delta===0).length;
const report={
  schema:'army14-evolution-lab/delta/v1',
  generatedAt:new Date().toISOString(),
  baseline:baseline.mutation,
  candidate:candidate.mutation,
  soldiers:rows.length,
  improved, regressed, unchanged,
  netDelta: rows.reduce((s,r)=>s+r.delta,0),
  promotion: regressed===0 && improved>0 ? 'BLOCKED_NEEDS_INDEPENDENT_VERIFICATION' : 'BLOCKED',
  rows
};
await writeFile('.lab/results/delta.json', JSON.stringify(report,null,2));
console.log(JSON.stringify({schema:report.schema,improved,regressed,unchanged,netDelta:report.netDelta,promotion:report.promotion}));
