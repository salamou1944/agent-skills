import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const norm=s=>String(s||'').toLowerCase();

export async function loadSkillRegistry(){
  const registry=JSON.parse(await fs.readFile(path.join(ROOT,'skill-registry.json'),'utf8'));
  const catalog=await fs.readFile(path.join(ROOT,'INTERNAL-CAPABILITY-CATALOG.md'),'utf8');
    const ids=[...catalog.matchAll(/\| \x60([^\x60]+)\x60 \|/g)].map(m=>m[1]).filter(x=>x!=='ID');
  return {...registry,skillIds:[...new Set(ids)]};
}

const RULES=[
  {terms:['security','nmap','scan','cve','secret','sast'],skills:['security-audit','security-gate','permission-aware-executor','evidence-backed-operator']},
  {terms:['browser','website','click','navigate','web'],skills:['browser-presence-operator','prompt-firewall','evidence-backed-operator']},
  {terms:['revenue','customer','lead','sell','money','outreach'],skills:['revenue-opportunity-discovery','revenue-path-validator','revenue-compliance-gate']},
  {terms:['deploy','railway','vercel','ci','github','pull request'],skills:['github-delivery','release-verification','release-observer']},
  {terms:['api','integration','endpoint','provider'],skills:['real-api-testing','api-production-readiness','permission-aware-executor']},
  {terms:['bug','error','failure','broken','fix'],skills:['bug-triage','failure-recovery-operator','regression-synthesizer']},
  {terms:['easy','creative','seller','commerce'],skills:['easy-continuous-builder','customer-to-code','verified-change']},
  {terms:['orchestrate','agent','multi','task'],skills:['adaptive-orchestrator','delegated-user-operator','persistent-task-operator']}
];

export function routeIntent(goal, skillIds=[]){
  const g=norm(goal);
  const scored=RULES.map(rule=>({skills:rule.skills,score:rule.terms.reduce((n,t)=>n+(g.includes(t)?1:0),0)}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  const selected=[];
  for(const row of scored) for(const s of row.skills) if(skillIds.includes(s)&&!selected.includes(s)) selected.push(s);
  if(!selected.includes('evidence-backed-operator')&&skillIds.includes('evidence-backed-operator'))selected.push('evidence-backed-operator');
  if(!selected.includes('permission-aware-executor')&&skillIds.includes('permission-aware-executor'))selected.push('permission-aware-executor');
  return {selected,matchedRules:scored.filter(x=>x.score>0).map(x=>x.skills)};
}

export async function buildExecutionPlan(task,{capabilities={},adapters={}}={}){
  const registry=await loadSkillRegistry();
  const route=routeIntent(task.goal,registry.skillIds);
  const required=task.requestedCapabilities.length?task.requestedCapabilities:['local'];
  const capabilityResults=required.map(name=>{
    const c=capabilities[name];
    if(!c)return {name,status:'BLOCKED_PERMISSION',reason:'capability_not_registered'};
    if(c.authorized!==true)return {name,status:'BLOCKED_PERMISSION',reason:'not_authorized'};
    if(c.reachable!==true)return {name,status:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'not_reachable'};
    return {name,status:'AVAILABLE'};
  });
  const executable=required.filter(name=>adapters[name]?.status==='ADAPTER_READY');
  return {
    taskId:task.taskId,
    state:capabilityResults.every(x=>x.status==='AVAILABLE')?'PLANNED':'BLOCKED',
    skills:route.selected,
    capabilities:capabilityResults,
    executableAdapters:executable,
    executionAllowed:capabilityResults.every(x=>x.status==='AVAILABLE') && executable.length===required.length,
    policy:'No unregistered adapter execution; no capability inferred from registry membership alone.'
  };
}
