import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// Tasks are grouped by path scope so independent work can be planned in parallel
// without allowing overlapping workers to mutate the same state concurrently.
export const TASKS = [
  { id:'mony.product-listing-sales', phase:'mony', scope:'apps/revenue-engine/product-listing', goal:'Complete and verify the canonical productized listing sales service over the existing Salamou-31 AI Product Content API, covering offer, qualification, order, generation, delivery artifact, and payment-ready handoff without creating a second generation engine.', verify:'npm run test:product-listing-sales' },
  { id:'mony.payment-billing', phase:'mony', scope:'apps/revenue-engine/payment-billing', goal:'Complete the provider-neutral payment and billing adapter boundary for Revenue Engine. Preserve payment-ready handoff until live credentials and integration evidence exist.', verify:'npm run test:payment-billing' },
  { id:'mony.pipeline', phase:'mony', scope:'apps/revenue-engine/sales-pipeline', goal:'Complete and verify the Revenue Engine client/opportunity pipeline with explicit found -> submitted -> replied -> call -> accepted -> paid -> delivery -> recurring states.', verify:'npm run test:sales' },
  { id:'mony.reusable-services', phase:'mony', scope:'apps/revenue-engine/services', goal:'Make existing Revenue Engine service/API capabilities directly reusable for paid client work with provider-neutral boundaries and production-readiness checks.', verify:'npm run test:paid-client-readiness' },
  { id:'mony.affiliate', phase:'mony', scope:'apps/revenue-engine/affiliate', goal:'Complete and verify existing affiliate/income integrations without storing secrets.', verify:'npm run revenue:affiliate:test' },
  { id:'mony.market-testing', phase:'mony', scope:'apps/revenue-engine/market', goal:'Build and verify market-testing and client-hunting automation that produces actionable opportunities without falsely claiming leads, replies, or revenue.', verify:'npm run test:service-market' },
  { id:'mony.first-revenue-blocker', phase:'mony', scope:'apps/revenue-engine/revenue-readiness', goal:'Identify and implement the smallest safe verified step that removes the next concrete blocker to first verified Revenue Engine revenue. If an LLM provider returns 429/404/410/408/5xx, use the repository fallback/recovery mechanisms where available, add deterministic coverage for the failure mode, and never mark the task complete without execution evidence.', verify:'npm run test:revenue:all' },
  { id:'elite.repository-repair', phase:'mony', scope:'apps/easy-developer-platform/repair', goal:'Perform a repository-wide defect pass after the Revenue Engine blocker: inspect tracked source, workflows, tests, fixtures, and generated state; repair concrete syntax/runtime/contract/CI defects; remove malformed fixtures or stale endpoint assumptions; and add regression tests for every defect actually found. Do not convert failures into NOOP merely because a preflight test passes.', verify:'npm run test:elite' },
  { id:'elite.defect-closure', phase:'mony', scope:'apps/easy-developer-platform/defects', goal:'Resolve every currently documented unresolved engineering defect/gap, including DEF-005 and DEF-006 if they are still present in repository state. Locate the authoritative defect records, implement the missing behavior rather than only documenting it, and add or repair deterministic acceptance tests. Preserve fail-closed behavior where live infrastructure is unavailable.', verify:'npm run test:elite' },
  { id:'elite.ci-contract-closure', phase:'mony', scope:'apps/easy-developer-platform/ci-contracts', goal:'Audit and repair the Elite, engineering-update, tool-intelligence, and tool-capability CI contracts and their self-tests. Reproduce failures, fix root causes, and ensure workflows cannot report success from skipped, simulated, stale, or mismatched checks. Verify the complete local contract suite before completion.', verify:'npm run test:elite:queue' },
  { id:'elite.release-evidence', phase:'mony', scope:'apps/easy-developer-platform/release-evidence', goal:'Run a final release-readiness evidence pass over the repository after all repairs: syntax, tests, workflow contracts, queue state, changed-file integrity, and deployment-facing configuration. Reconcile stale FAILED/NOOP evidence only when new execution evidence proves the current state. Never claim 100% or VERIFIED from historical evidence.', verify:'npm run test:revenue:all' },
  { id:'mony.pipeline-live-readiness', phase:'mony', scope:'apps/revenue-engine/live-readiness', goal:'Prepare the Revenue Engine for the first real paid-client execution without inventing provider access: verify live activation prerequisites, surface exact missing credentials/integrations, and make the operator fail closed with actionable diagnostics.', verify:'npm run revenue:doctor' },
  { id:'easy.inspect-blocker', phase:'easy', scope:'easy/inspection', repo:'salamou1944/Easy-', goal:'Inspect the real EASY repository state and complete the highest-value unfinished practical blocker.', verify:'npm test' },
  { id:'easy.creative-engine', phase:'easy', scope:'easy/creative', repo:'salamou1944/Easy-', goal:'Complete the real EASY Creative Engine path: Product DNA -> Product Integrity -> creative instruction/orchestration -> provider boundary -> validated output, preserving product facts, colors, text, logos, and product identity.', verify:'npm test' },
  { id:'easy.seller-product', phase:'easy', scope:'easy/seller-product', repo:'salamou1944/Easy-', goal:'Complete the seller/product workflow needed to take a product from input to a usable result.', verify:'npm test' },
  { id:'easy.commerce-boundary', phase:'easy', scope:'easy/commerce', repo:'salamou1944/Easy-', goal:'Complete and verify provider-neutral commerce integration with safe fixture/live boundaries; do not require live credentials for fixture tests.', verify:'npm test' },
  { id:'easy.e2e', phase:'easy', scope:'easy/e2e', repo:'salamou1944/Easy-', goal:'Add or repair end-to-end verification for the primary seller journey and critical failure paths.', verify:'npm test' },
  { id:'easy.next-capability', phase:'easy', scope:'easy/next-capability', repo:'salamou1944/Easy-', goal:'Identify and implement the next concrete missing capability required for a usable/sellable EASY release, using the smallest safe verified step.', verify:'npm test' }
];

const TERMINAL = new Set(['VERIFIED','NOOP']);

export async function loadState(file='.easy/project-queue-state.json') {
  try { return JSON.parse(await readFile(file,'utf8')); }
  catch { return {version:2,tasks:{},history:[]}; }
}

export function selectNext(state, phase=null) {
  for (const task of TASKS) {
    if (phase && task.phase!==phase) continue;
    const s=state.tasks?.[task.id];
    if (!s || !TERMINAL.has(s.status)) return task;
  }
  return null;
}

// Return the maximal safe parallel batch. Tasks with the same scope are never
// placed in the same batch; integration/merge must run after the batch completes.
export function selectParallelBatch(state, phase=null, limit=14) {
  const batch=[];
  const scopes=new Set();
  for (const task of TASKS) {
    if (phase && task.phase!==phase) continue;
    const status=state.tasks?.[task.id]?.status;
    if (TERMINAL.has(status) || scopes.has(task.scope)) continue;
    scopes.add(task.scope);
    batch.push(task);
    if (batch.length>=limit) break;
  }
  return batch;
}

export function classifyResult(result) {
  if (result==='VERIFIED' || result==='VERIFIED_CHANGE') return 'VERIFIED';
  if (result==='VERIFIED_NOOP' || result==='NOOP') return 'NOOP';
  if (result==='BLOCKED_WITH_EVIDENCE') return 'BLOCKED';
  if (result==='FAILED') return 'FAILED';
  throw new Error('invalid_result_class:'+result);
}

export async function markTask(file,id,status,evidence=[]) {
  const state=await loadState(file);
  const task=TASKS.find(t=>t.id===id); if(!task) throw new Error('unknown_task:'+id);
  status=classifyResult(status);
  state.version=2;
  state.tasks[id]={status,evidence,scope:task.scope,updatedAt:new Date().toISOString()};
  state.history.push({id,status,evidence,scope:task.scope,at:new Date().toISOString()});
  await mkdir(dirname(file),{recursive:true}); await writeFile(file,JSON.stringify(state,null,2)+'\n');
  return state;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const file=process.env.ELITE_QUEUE_STATE||'.easy/project-queue-state.json';
  const command=process.argv[2]||'next';
  const state=await loadState(file);
  if(command==='mark'){
    const id=process.argv[3], status=process.argv[4], evidence=process.argv[5]?JSON.parse(process.argv[5]):[];
    console.log(JSON.stringify(await markTask(file,id,status,evidence),null,2));
  } else if(command==='parallel') {
    const phase=process.env.ELITE_QUEUE_PHASE||null;
    console.log(JSON.stringify({stateFile:file,phase,batch:selectParallelBatch(state,phase,Number(process.env.ELITE_QUEUE_PARALLELISM||14))},null,2));
  } else {
    const phase=process.env.ELITE_QUEUE_PHASE||null; const task=selectNext(state,phase);
    console.log(JSON.stringify({stateFile:file,phase,next:task,parallelBatch:selectParallelBatch(state,phase,14),completed:Object.entries(state.tasks||{}).filter(([,v])=>TERMINAL.has(v.status)).map(([id])=>id),monyComplete:TASKS.filter(t=>t.phase==='mony').every(t=>TERMINAL.has(state.tasks?.[t.id]?.status))},null,2));
  }
}
