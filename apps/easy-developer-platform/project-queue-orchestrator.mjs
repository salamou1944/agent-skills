import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// Project execution order is deliberately mony-first, then EASY.
export const TASKS = [
  { id:'mony.payment-billing', phase:'mony', repo:'salamou1944/agent-skills', goal:'Complete the provider-neutral payment and billing adapter boundary for Revenue Engine. Preserve payment-ready handoff until live credentials and integration evidence exist.', verify:'npm run test:payment-billing' },
  { id:'mony.pipeline', phase:'mony', repo:'salamou1944/agent-skills', goal:'Complete and verify the Revenue Engine client/opportunity pipeline with explicit found -> submitted -> replied -> call -> accepted -> paid -> delivery -> recurring states.', verify:'npm run test:sales' },
  { id:'mony.reusable-services', phase:'mony', repo:'salamou1944/agent-skills', goal:'Make existing Revenue Engine service/API capabilities directly reusable for paid client work with provider-neutral boundaries and production-readiness checks.', verify:'npm run test:revenue:all' },
  { id:'mony.affiliate', phase:'mony', repo:'salamou1944/agent-skills', goal:'Complete and verify existing affiliate/income integrations without storing secrets.', verify:'npm run revenue:affiliate:test' },
  { id:'mony.market-testing', phase:'mony', repo:'salamou1944/agent-skills', goal:'Build and verify market-testing and client-hunting automation that produces actionable opportunities without falsely claiming leads, replies, or revenue.', verify:'npm run test:service-market' },
  { id:'mony.first-revenue-blocker', phase:'mony', repo:'salamou1944/agent-skills', goal:'Identify and implement the smallest safe verified step that removes the next concrete blocker to first verified Revenue Engine revenue.', verify:'npm run test:revenue:all' },
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
