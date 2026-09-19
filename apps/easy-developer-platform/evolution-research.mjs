import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const PROJECTS=new Set(['EASY','MONY','ELITE','ARMY-14','EVOLUTION-LAB','AGENT-SKILLS']);
const MAX_FILES=220;
const IGNORE=new Set(['.git','node_modules','.next','.easy']);

function run(cmd,args,cwd){return new Promise(resolveResult=>{const p=spawn(cmd,args,{cwd,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('close',code=>resolveResult({code,stdout,stderr}));p.on('error',e=>resolveResult({code:null,stdout,stderr:String(e)}))})}
async function walk(root,dir=root,out=[]){for(const entry of await readdir(dir,{withFileTypes:true})){if(IGNORE.has(entry.name))continue;const path=join(dir,entry.name);if(entry.isDirectory())await walk(root,path,out);else if(out.length<MAX_FILES)out.push(relative(root,path))}return out}
function hasAny(files,patterns){return patterns.some(pattern=>files.some(file=>pattern.test(file)))}
function gap(id,severity,signal,missing){return {id,severity,signal,missing}}
export async function discoverGaps(root,projectId,experimentId='research'){
  if(!PROJECTS.has(projectId))throw new Error('project_id_not_allowlisted');
  const workspace=resolve(root), rev=(await run('git',['rev-parse','HEAD'],workspace)).stdout.trim();
  if(!rev)throw new Error('baseline_revision_unavailable');
  const files=await walk(workspace);
  const gaps=[];
  if(!hasAny(files,[/evolution-mutation-generator\.mjs$/]))gaps.push(gap('mutation-generation','critical','no candidate-generation layer','provider-backed competing mutation generation'));
  if(!hasAny(files,[/evolution-independent-verifier\.mjs$/]))gaps.push(gap('independent-verification','critical','no fresh-sandbox verifier','replay winner independently against recorded evidence'));
  if(!hasAny(files,[/evolution-negative-knowledge\.mjs$/]))gaps.push(gap('negative-knowledge','high','no durable rejection ledger','preserve failed hypotheses and rejected mutations'));
  if(!hasAny(files,[/evolution-research\.mjs$/]))gaps.push(gap('gap-discovery','high','no executable gap-discovery layer','machine-readable capability-gap reports'));
  if(!hasAny(files,[/evolution-frontier.mjs$/]))gaps.push(gap('closed-loop-orchestration','critical','no end-to-end frontier loop','research to mutation to verification to learning'));
  const contract=files.find(f=>/EVOLUTION-FRONTIER-CONTRACT\.md$/i.test(f));
  if(!contract)gaps.push(gap('frontier-contract','medium','no local frontier contract','explicit safety/evidence invariants'));
  return {status:'GAPS_DISCOVERED',project_id:projectId,experiment_id:experimentId,baseline_revision:rev,file_count:files.length,gaps,signals:{mutationGeneration:hasAny(files,[/evolution-mutation-generator\.mjs$/]),independentVerification:hasAny(files,[/evolution-independent-verifier\.mjs$/]),negativeKnowledge:hasAny(files,[/evolution-negative-knowledge\.mjs$/]),research:hasAny(files,[/evolution-research\.mjs$/]),closedLoop:hasAny(files,[/evolution-frontier\.mjs$/])}};
}


if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const [workspace='.',projectId='EVOLUTION-LAB',experimentId='research-run']=process.argv.slice(2);
  const result=await discoverGaps(workspace,projectId,experimentId);
  console.log(JSON.stringify(result,null,2));
}
