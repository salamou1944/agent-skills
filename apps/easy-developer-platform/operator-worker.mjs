import { createTask, enqueue, loadState, nextRunnable, updateTask } from './operator-state.mjs';
import { runEliteEngine } from './elite-engine.mjs';

function config(overrides={}) {
  return {
    stateFile: overrides.stateFile || process.env.EASY_OPERATOR_STATE || '.easy/operator-state.json',
    workspace: overrides.workspace || process.env.EASY_OPERATOR_WORKSPACE || '.',
    intervalMs: Math.max(5000, Number(overrides.intervalMs || process.env.EASY_OPERATOR_INTERVAL_MS || 300000)),
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
  await updateTask(cfg.stateFile, task.id, { status:'RUNNING', attempts:task.attempts+1, updatedAt:new Date().toISOString() });
  try {
    const result=await runEliteEngine(task.goal, { root:cfg.workspace, policy:{ maxRepairs:2 } });
    const status=result.status==='verified'?'VERIFIED':result.status==='blocked'?'BLOCKED':'FAILED';
    const attempts=task.attempts+1;
    const retry=status==='FAILED' && attempts<cfg.maxAttempts;
    await updateTask(cfg.stateFile, task.id, {
      status:retry?'QUEUED':status,
      evidence:result.evidence||[],
      result,
      finishedAt:retry?null:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    });
    return { taskId:task.id, status:retry?'QUEUED':status, attempts, result };
  } catch (error) {
    const attempts=task.attempts+1;
    const retry=attempts<cfg.maxAttempts;
    await updateTask(cfg.stateFile, task.id, { status:retry?'QUEUED':'FAILED', result:{status:'FAILED',error:error.message,code:error.code||null}, finishedAt:retry?null:new Date().toISOString(), updatedAt:new Date().toISOString() });
    return { taskId:task.id, status:retry?'QUEUED':'FAILED', attempts, error:error.message, code:error.code||null };
  }
}

export async function worker({once=false, signal=undefined, ...options}={}) {
  const cfg=config(options); let stopped=false;
  const stop=()=>{stopped=true};
  if (signal) signal.addEventListener('abort', stop, {once:true});
  while (!stopped) {
    try { await runOnce(cfg); } catch (error) { console.error(JSON.stringify({service:'elite-background-worker',event:'cycle-error',error:error.message})); }
    if (once) break;
    await new Promise(resolve => setTimeout(resolve, cfg.intervalMs));
  }
}

export function report(state) {
  const tasks=state.tasks||[];
  return { version:2, engine:'elite', generatedAt:new Date().toISOString(), totals:{queued:tasks.filter(t=>t.status==='QUEUED').length,running:tasks.filter(t=>t.status==='RUNNING').length,verified:tasks.filter(t=>t.status==='VERIFIED').length,failed:tasks.filter(t=>t.status==='FAILED').length,blocked:tasks.filter(t=>t.status==='BLOCKED').length}, tasks:tasks.map(t=>({id:t.id,goal:t.goal,status:t.status,attempts:t.attempts,updatedAt:t.updatedAt,summary:t.result?.summary||t.result?.error||null})) };
}

if (import.meta.url===`file://${process.argv[1]}`) {
  const goal=process.argv.slice(2).join(' ');
  const cfg=config();
  if (goal) await submit(goal);
  await worker({once:true});
  console.log(JSON.stringify(report(await loadState(cfg.stateFile)), null, 2));
}
