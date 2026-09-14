import { createTask, enqueue, loadState, nextRunnable, updateTask } from './operator-state.mjs';
import { execute } from './ai-operator.mjs';

function config(overrides={}) {
  return {
    stateFile: overrides.stateFile || process.env.EASY_OPERATOR_STATE || '.easy/operator-state.json',
    workspace: overrides.workspace || process.env.EASY_OPERATOR_WORKSPACE || '.',
    intervalMs: Math.max(250, Number(overrides.intervalMs || process.env.EASY_OPERATOR_INTERVAL_MS || 2000)),
    maxAttempts: Math.max(1, Number(overrides.maxAttempts || process.env.EASY_OPERATOR_MAX_ATTEMPTS || 3))
  };
}

export async function submit(goal, metadata={}, options={}) {
  const task=createTask(goal, metadata);
  if (!task.goal) throw new Error('goal_required');
  return enqueue(config(options).stateFile, task);
}

export async function runOnce(options={}) {
  const cfg=config(options), task=await nextRunnable(cfg.stateFile);
  if (!task) return null;
  await updateTask(cfg.stateFile, task.id, { status:'RUNNING', attempts:task.attempts+1 });
  try {
    const result=await execute(task.goal, { workspace:cfg.workspace, allowHighRisk:false });
    const status=result.status==='VERIFIED'?'VERIFIED':result.status==='BLOCKED'?'BLOCKED':'FAILED';
    await updateTask(cfg.stateFile, task.id, { status, evidence:result.evidence||[], result, finishedAt:new Date().toISOString() });
    return { taskId:task.id, status, result };
  } catch (error) {
    const attempts=task.attempts+1;
    const status=attempts>=cfg.maxAttempts?'FAILED':'QUEUED';
    await updateTask(cfg.stateFile, task.id, { status, result:{status:'FAILED',error:error.message}, finishedAt:status==='FAILED'?new Date().toISOString():null });
    return { taskId:task.id, status, error:error.message };
  }
}

export async function worker({once=false, signal=undefined, ...options}={}) {
  const cfg=config(options); let stopped=false;
  const stop=()=>{stopped=true};
  if (signal) signal.addEventListener('abort', stop, {once:true});
  while (!stopped) {
    await runOnce(cfg);
    if (once) break;
    await new Promise(resolve => setTimeout(resolve, cfg.intervalMs));
  }
}

export function report(state) {
  const tasks=state.tasks||[];
  return { version:1, generatedAt:new Date().toISOString(), totals:{queued:tasks.filter(t=>t.status==='QUEUED').length,running:tasks.filter(t=>t.status==='RUNNING').length,verified:tasks.filter(t=>t.status==='VERIFIED').length,failed:tasks.filter(t=>t.status==='FAILED').length,blocked:tasks.filter(t=>t.status==='BLOCKED').length}, tasks:tasks.map(t=>({id:t.id,goal:t.goal,status:t.status,attempts:t.attempts,updatedAt:t.updatedAt,summary:t.result?.summary||t.result?.error||null})) };
}

if (import.meta.url===`file://${process.argv[1]}`) {
  const goal=process.argv.slice(2).join(' ');
  const cfg=config();
  if (goal) await submit(goal);
  await worker({once:true});
  console.log(JSON.stringify(report(await loadState(cfg.stateFile)), null, 2));
}
