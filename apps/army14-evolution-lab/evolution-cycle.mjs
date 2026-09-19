import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { scoreExperiment, experimentId, verdict } from './scientific-evaluator.mjs';

const baseline=JSON.parse(await readFile('.lab/results/baseline.json','utf8'));
const candidate=JSON.parse(await readFile('.lab/results/candidate.json','utf8'));
let delta=null;
try { delta=JSON.parse(await readFile('.lab/results/delta.json','utf8')); } catch {}

const maxDuration=Math.max(...candidate.results.map(x=>Number(x.targetDurationMs)||0),0);
const score=scoreExperiment({
  baseline,
  candidate:{...candidate,regressed:delta?.regressed??0,soldiers:candidate.soldiers,maxDurationMs:maxDuration},
  independent:false
});
const decision=verdict({
  baselineScore:scoreExperiment({baseline:{passRate:baseline.passRate},candidate:{passRate:baseline.passRate,regressed:0,soldiers:baseline.soldiers}}).composite,
  candidateScore:score.composite,
  regressed:delta?.regressed??0,
  independent:false
});
const report={
  schema:'army14-evolution-lab/cycle/v1',
  id:experimentId({baseline:baseline.mutation,candidate:candidate.mutation}),
  researchPrinciples:['P1','P2','P3','P4','P5'],
  baseline:baseline.mutation,
  candidate:candidate.mutation,
  score,
  decision,
  independentEvidenceRequired:true,
  promotion:'BLOCKED'
};
await mkdir('.lab/results',{recursive:true});
await writeFile('.lab/results/evolution-cycle.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
