import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// Project execution order is deliberately mony-first, then EASY.
// Tasks that require autonomous implementation, cross-cutting repair, or evidence
// reconciliation are kept in this queue so Elite handles them instead of silently
// converting a failing integration into a NOOP.
export const TASKS = [
  { id:'mony.product-listing-sales', phase:'mony', repo:'salamou1944/agent-skills', goal:'Complete and verify the canonical productized listing sales service over the existing Salamou-31 AI Product Content API, covering offer, qualification, order, generation, delivery artifact, and payment-ready handoff without creating a second generation engine.', verify:'npm run test:product-listing-sales' },
  { id:'mony.payment-billing', phase:'mony', repo:'salamou1944/agent-skills', goal:'Complete the provider-neutral payment and billing adapter boundary for Revenue Engine. Preserve payment-ready handoff until live credentials and integration evidence exist.', verify:'npm run test:payment-billing' },
  { id:'mony.pipeline', phase:'mony', repo:'salamou1944/agent-skills', goal:'Complete and verify the Revenue Engine client/opportunity pipeline with explicit found -> submitted -> replied -> call -> accepted -> paid -> delivery -> recurring states.', verify:'npm run test:sales' },
  { id:'mony.reusable-services', phase:'mony', repo:'salamou1944/agent-skills', goal:'Make existing Revenue Engine service/API capabilities directly reusable for paid client work with provider-neutral boundaries and production-readiness checks.', verify:'npm run test:paid-client-readiness' },
  { id:'mony.affiliate', phase:'mony', repo:'salamou1944/agent-skills', goal:'Complete and verify existing affiliate/income integrations without storing secrets.', verify:'npm run revenue:affiliate:test' },
  { id:'mony.market-testing', phase:'mony', repo:'salamou1944/agent-skills', goal:'Build and verify market-testing and client-hunting automation that produces actionable opportunities without falsely claiming leads, replies, or revenue.', verify:'npm run test:service-market' },
  { id:'mony.first-revenue-blocker', phase:'mony', repo:'salamou1944/agent-skills', goal:'Identify and implement the smallest safe verified step that removes the next concrete blocker to first verified Revenue Engine revenue. If an LLM provider returns 429/404/410/408/5xx, use the repository fallback/recovery mechanisms where available, add deterministic coverage for the failure mode, and never mark the task complete without execution evidence.', verify:'npm run test:revenue:all' },
  { id:'elite.repository-repair', phase:'mony', repo:'salamou1944/agent-skills', goal:'Perform a repository-wide defect pass after the Revenue Engine blocker: inspect tracked source, workflows, tests, fixtures, and generated state; repair concrete syntax/runtime/contract/CI defects; remove malformed fixtures or stale endpoint assumptions; and add regression tests for every defect actually found. Do not convert failures into NOOP merely because a preflight test passes.', verify:'npm run test:elite' },
  { id:'elite.defect-closure', phase:'mony', repo:'salamou1944/agent-skills', goal:'Resolve every currently documented unresolved engineering defect/gap, including DEF-005 and DEF-006 if they are still present in repository state. Locate the authoritative defect records, implement the missing behavior rather than only documenting it, and add or repair deterministic acceptance tests. Preserve fail-closed behavior where live infrastructure is unavailable.', verify:'npm run test:elite' },
  { id:'elite.ci-contract-closure', phase:'mony', repo:'salamou1944/agent-skills', goal:'Audit and repair the Elite, engineering-update, tool-intelligence, and tool-capability CI contracts and their self-tests. Reproduce failures, fix root causes, and ensure workflows cannot report success from skipped, simulated, stale, or mismatched checks. Verify the complete local contract suite before completion.', verify:'npm run test:elite:queue' },
  { id:'elite.release-evidence', phase:'mony', repo:'salamou1944/agent-skills', goal:'Run a final release-readiness evidence pass over the repository after all repairs: syntax, tests, workflow contracts, queue state, changed-file integrity, and deployment-facing configuration. Reconcile stale FAILED/NOOP evidence only when new execution evidence proves the current state. Never claim 100% or VERIFIED from historical evidence.', verify:'npm run test:revenue:all' },
  { id:'mony.pipeline-live-readiness', phase:'mony', repo:'salamou1944/agent-skills', goal:'Prepare the Revenue Engine for the first real paid-client execution without inventing provider access: verify live activation prerequisites, surface exact missing credentials/integrations, and make the operator fail closed with actionable diagnostics.', verify:'npm run revenue:doctor' },
  { id:'easy.inspect-blocker', phase:'easy', repo:'salamou1944/Easy-', goal:'Inspect the real EASY repository state and complete the highest-value unfinished practical blocker.', verify:'npm test' },
  { id:'easy.creative-engine', phase:'easy', repo:'salamou1944/Easy-', goal:'Complete the real EASY Creative Engine path: Product DNA -> Product Integrity -> creative instruction/orchestration -> provider boundary -> validated output, preserving product facts, colors, text, logos, and product identity.', verify:'npm test' },
  { id:'easy.seller-product', phase:'easy', repo:'salamou1944/Easy-', goal:'Complete the seller/product workflow needed to take a product from input to a usable result.', verify:'npm test' },
  { id:'easy.commerce-boundary', phase:'easy', repo:'salamou1944/Easy-', goal:'Complete and verify provider-neutral commerce integration with safe fixture/live boundaries; do not require live credentials for fixture tests.', verify:'npm test' },
  { id:'easy.e2e', phase:'easy', repo:'salamou1944/Easy-', goal:'Add or repair end-to-end verification for the primary seller journey and critical failure paths.', verify:'npm test' },
  { id:'easy.next-capability', phase:'easy', repo:'salamou1944/Easy-', goal:'Identify and implement the next concrete missing capability required for a usable/sellable EASY release, using the smallest safe verified step.', verify:'npm test' }
];

export async function loadState(file='.easy/project-queue-state.json') {
  try { return JSON.parse(await readFile(file,'utf8')); }
  catch { return {version:1,tasks:{},history:[]}; }
}

export function selectNext(state, phase=null) {
  for (const task of TASKS) {
    if (phase && task.phase!==phase) continue;
    const s=state.tasks?.[task.id];
    if (!s || !['VERIFIED','NOOP'].includes(s.status)) return task;
  }
  return null;
}

export async function markTask(file,id,status,evidence=[]) {
  const state=await loadState(file);
  const task=TASKS.find(t=>t.id===id); if(!task) throw new Error('unknown_task:'+id);
  if(!['VERIFIED','NOOP','BLOCKED','FAILED'].includes(status)) throw new Error('invalid_status:'+status);
  state.tasks[id]={status,evidence,updatedAt:new Date().toISOString()};
  state.history.push({id,status,evidence,at:new Date().toISOString()});
  await mkdir(dirname(file),{recursive:true}); await writeFile(file,JSON.stringify(state,null,2)+'\n');
  return state;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const file=process.env.ELITE_QUEUE_STATE||'.easy/project-queue-state.json';
  const command=process.argv[2]||'next';
  if(command==='mark'){
    const id=process.argv[3], status=process.argv[4], evidence=process.argv[5]?JSON.parse(process.argv[5]):[];
    console.log(JSON.stringify(await markTask(file,id,status,evidence),null,2));
  } else {
    const state=await loadState(file); const phase=process.env.ELITE_QUEUE_PHASE||null; const task=selectNext(state,phase);
    console.log(JSON.stringify({stateFile:file,phase,next:task,completed:Object.entries(state.tasks||{}).filter(([,v])=>['VERIFIED','NOOP'].includes(v.status)).map(([id])=>id),monyComplete:TASKS.filter(t=>t.phase==='mony').every(t=>['VERIFIED','NOOP'].includes(state.tasks?.[t.id]?.status))},null,2));
  }
}
