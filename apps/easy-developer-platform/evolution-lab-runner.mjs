import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { LABS, createExperiment, appendExperiment, buildSoldierReport } from './evolution-lab.mjs';

const ALLOWED = new Set(['node','npm','npx']);
function args(argv){const o={runs:5,warmup:1,ledger:'.easy/evolution-lab/experiments.json',report:'.easy/evolution-lab/report.json'};for(let i=0;i<argv.length;i++){const k=argv[i],v=argv[i+1];if(k==='--runs')o.runs=Math.max(1,Number(v));else if(k==='--warmup')o.warmup=Math.max(0,Number(v));else if(k==='--soldier')o.soldierId=String(v);else if(k==='--soldier-name')o.soldierName=v;else if(k==='--hypothesis')o.hypothesis=v;else if(k==='--baseline')o.baseline=v;else if(k==='--candidate')o.candidate=v;else if(k==='--ledger')o.ledger=v;else if(k==='--report')o.report=v;else if(k==='--labs')o.labs=String(v).split(',').filter(Boolean)}return o}
function spec(raw){if(!raw)throw Error('command_required');const a=JSON.parse(raw);if(!Array.isArray(a)||!a.length||!ALLOWED.has(a[0])||a.some(x=>typeof x!=='string'))throw Error('unsafe_command');return a}
function once(a){return new Promise(r=>{const t=performance.now(),p=spawn(a[0],a.slice(1),{stdio:['ignore','pipe','pipe'],shell:false});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',e=>r({ok:false,ms:performance.now()-t,error:e.message,out,err}));p.on('close',(code,signal)=>r({ok:code===0,ms:performance.now()-t,code,signal,out,err}))})}
async function measure(a,n,w){for(let i=0;i<w;i++)await once(a);const rows=[];for(let i=0;i<n;i++)rows.push(await once(a));const ts=rows.map(x=>x.ms).sort((a,b)=>a-b),pct=p=>ts[Math.min(ts.length-1,Math.floor((ts.length-1)*p))],ok=rows.filter(x=>x.ok).length;return {successRate:ok/n,medianMs:pct(.5),p95Ms:pct(.95),retryRate:0,reworkRate:0,verificationRate:ok/n,samples:rows.map(x=>({ok:x.ok,ms:Math.round(x.ms),code:x.code??null}))}}
async function json(path){try{return JSON.parse(await readFile(path,'utf8'))}catch(e){if(e.code==='ENOENT')return [];throw e}}
const a=args(process.argv.slice(2));if(!a.soldierId||!a.hypothesis||!a.baseline||!a.candidate)throw Error('soldier_hypothesis_baseline_candidate_required');
const baseline=await measure(spec(a.baseline),a.runs,a.warmup),candidate=await measure(spec(a.candidate),a.runs,a.warmup);
const safety={adversarialPass:false,regressionPass:false,verified:candidate.successRate===1};
const experiment=createExperiment({soldierId:a.soldierId,soldierName:a.soldierName,hypothesis:a.hypothesis,labs:a.labs??LABS,baseline,candidate,safety,metadata:{runner:'evolution-lab-runner-v1',baselineCommand:spec(a.baseline),candidateCommand:spec(a.candidate),runs:a.runs,warmup:a.warmup}});
await appendExperiment(a.ledger,experiment);const records=await json(a.ledger);await mkdir(dirname(a.report),{recursive:true});await writeFile(a.report,JSON.stringify({version:'evolution-lab-report-v1',generatedAt:new Date().toISOString(),experimentId:experiment.experimentId,experimentStatus:experiment.evaluation.status,soldier:buildSoldierReport(records),experiment},null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({status:experiment.evaluation.status,experimentId:experiment.experimentId,baseline,candidate,evaluation:experiment.evaluation,ledger:a.ledger,report:a.report},null,2));
