import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FILE=process.env.OPERATOR_RUN_LEDGER||path.join(ROOT,'runtime','runs.jsonl');

async function ensure(){await fs.mkdir(path.dirname(DEFAULT_FILE),{recursive:true});}
async function append(record){await ensure();await fs.appendFile(DEFAULT_FILE,JSON.stringify(record)+'\n','utf8');}
export async function createRun(task){const key=String(task.idempotencyKey||task.taskId||'');const existing=(await listRuns(1000)).find(r=>r.idempotencyKey===key&&['QUEUED','RUNNING','RETRYING','VERIFIED'].includes(r.state));if(existing)return {...existing,reused:true};const run={runId:crypto.randomUUID(),taskId:task.taskId,idempotencyKey:key,state:'QUEUED',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),attempt:0};await append(run);return run;}
export async function updateRun(runId,patch){const run={runId,...patch,updatedAt:new Date().toISOString()};await append(run);return run;}
export async function listRuns(limit=100){try{const raw=await fs.readFile(DEFAULT_FILE,'utf8');const map=new Map();for(const line of raw.split('\n').filter(Boolean)){const r=JSON.parse(line);map.set(r.runId,{...(map.get(r.runId)||{}),...r});}return [...map.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,limit);}catch(e){if(e.code==='ENOENT')return [];throw e;}}
export async function getRun(runId){return (await listRuns()).find(r=>r.runId===runId)||null;}
export async function recoverInterruptedRuns(){const runs=await listRuns(1000);const interrupted=runs.filter(r=>['QUEUED','RUNNING','RETRYING'].includes(r.state));for(const r of interrupted)await updateRun(r.runId,{state:'FAILED',failure:{class:'process_restart',reason:'run_interrupted_by_runtime_restart'}});return interrupted.length;}
