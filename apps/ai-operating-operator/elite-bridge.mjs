import crypto from 'node:crypto';
import {createTask,evidence,verifyCompletion} from './operator-core.mjs';

const DEFAULT_TIMEOUT_MS=Number(process.env.ELITE_TIMEOUT_MS||120000);
const LOCAL_ENGINE_MODULE=new URL('../easy-developer-platform/elite-engine.mjs',import.meta.url);

function endpoint(){
  return String(process.env.ELITE_EXECUTOR_URL||'').trim().replace(/\/$/,'');
}

function headers(){
  const h={'content-type':'application/json','accept':'application/json'};
  const token=String(process.env.ELITE_EXECUTOR_TOKEN||'').trim();
  if(token) h.authorization=`Bearer ${token}`;
  return h;
}

function safeUrl(value){
  const u=new URL(value);
  if(u.protocol!=='https:' && u.hostname!=='localhost' && u.hostname!=='127.0.0.1') throw new Error('elite_endpoint_must_be_https');
  return u;
}

export function getEliteBridgeStatus(){
  const url=endpoint();
  if(!url && process.env.ELITE_LOCAL_ENGINE==='1') return {configured:true,authorized:true,reachable:true,state:'CONFIGURED_NOT_VERIFIED',mode:'local',source:'agent-skills/apps/easy-developer-platform/elite-engine.mjs'};
  if(!url) return {configured:false,authorized:false,reachable:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'ELITE_EXECUTOR_URL_missing'};
  try{
    const u=safeUrl(url);
    return {configured:true,authorized:Boolean(process.env.ELITE_EXECUTOR_TOKEN),reachable:null,endpoint:`${u.origin}${u.pathname}`,state:'CONFIGURED_NOT_VERIFIED'};
  }catch(error){
    return {configured:true,authorized:false,reachable:false,state:'FAILED',reason:error.message};
  }
}

function extractJsonPlan(content){
  const text=String(content||'').trim().replace(/^\`\`\`(?:json)?/i,'').replace(/\`\`\`$/,'').trim();
  try{return JSON.parse(text)}catch{
    const start=text.indexOf('{'),end=text.lastIndexOf('}');
    if(start<0||end<=start)throw new Error('capability_inference_non_json');
    return JSON.parse(text.slice(start,end+1));
  }
}

function buildCapabilityInferenceProvider(task,{capabilities,adapters,adapterInputs,adapterEnv,adapterOverrides,verifierOverrides,evidenceLog}){
  const invocation=task.capabilityArtifactInvocation;
  if(invocation?.adapter!=='ai.local.ollama') return null;
  return async ({role='planner',goal,context,failedPlan=null,failure=null,constraints={}})=>{
    const prompt=role==='repair'
      ? `You are the repair agent inside Elite. Diagnose the failed implementation and return the smallest safe corrected plan. Goal: ${goal}
Failure: ${JSON.stringify(failure)}
Failed plan: ${JSON.stringify(failedPlan)}
Repository context: ${String(context||'').slice(0,120000)}
Constraints: ${JSON.stringify(constraints)}
Return JSON only: {"summary":"...","changes":[{"path":"relative/path","content":"full file content"}]}`
      : role==='reviewer'||role==='final'
      ? `You are Elite's independent ${role} reviewer. Review the proposed change for the goal below. Return JSON only: {"approved":true|false,"findings":["..."],"reason":"..."}.
Goal: ${goal}
Context: ${String(context||'').slice(0,120000)}
`
      : `You are Elite's ${role}. Produce the smallest safe implementation plan for this goal. Repository context: ${String(context||'').slice(0,120000)}
Constraints: ${JSON.stringify(constraints)}
Return JSON only: {"summary":"...","changes":[{"path":"relative/path","content":"full file content"}]}`;
    const inferenceTask={...task,taskId:`${task.taskId}:inference:${role}:${crypto.randomUUID()}`,goal:prompt,requestedCapabilities:['ai.local.ollama'],allowedActions:['chat'],capabilitySelection:null,capabilityArtifact:null,capabilityArtifactInvocation:null};
    const result=await (await import('./executor.mjs')).executeTask(inferenceTask,{
      capabilities,adapters,adapterInputs:{
        ...adapterInputs,
        'ai.local.ollama':{
          ...(adapterInputs?.['ai.local.ollama']||{}),
          action:'chat',
          arguments:{
            model:adapterInputs?.['ai.local.ollama']?.arguments?.model||process.env.OPERATOR_OLLAMA_MODEL||'llama3.2',
            messages:[
              {role:'system',content:'You are a bounded inference component. Return only the requested JSON. Do not execute tools or commands.'},
              {role:'user',content:prompt}
            ],
            stream:false,
            format:'json',
            options:{temperature:0}
          }
        }
      },
      adapterEnv,
      adapterOverrides,
      verifierOverrides
    });
    if(result?.completion?.ok!==true||result?.verification?.passed!==true) throw new Error(`capability_inference_failed:${result?.state||'unknown'}`);
    const content=result?.result?.result?.data?.message?.content;
    const plan=extractJsonPlan(content);
    evidenceLog.push({kind:'capability_inference',role,adapter:'ai.local.ollama',passed:true,taskId:result.taskId,executionId:result.result?.executionId||null});
    return plan;
  };
}

export async function dispatchToElite(input={},{fetchImpl=fetch,timeoutMs=DEFAULT_TIMEOUT_MS,capabilities={},adapters={},adapterInputs={},adapterEnv=process.env,adapterOverrides={},verifierOverrides={}}={}){
  const url=endpoint();
  const task=createTask(input);
  if(!url && process.env.ELITE_LOCAL_ENGINE==='1'){
    const root=String(input.workspaceRoot||'').trim();
    const allowed=String(process.env.ELITE_ALLOWED_ROOT||'').trim();
    if(!root||!allowed) return {ok:false,state:'BLOCKED_PERMISSION',taskId:task.taskId,evidence:[evidence('action',{accepted:false,reason:'local_engine_root_not_authorized'})]};
    const resolvedRoot=new URL('file://'+root.replace(/\\\\/g,'/')).pathname;
    const allowedRoot=new URL('file://'+allowed.replace(/\\\\/g,'/')).pathname.replace(/\/$/,'');
    if(!(resolvedRoot===allowedRoot||resolvedRoot.startsWith(allowedRoot+'/'))) return {ok:false,state:'BLOCKED_PERMISSION',taskId:task.taskId,evidence:[evidence('action',{accepted:false,reason:'workspace_root_outside_allowlist'})]};
    try{
      const {runEliteEngine}=await import(LOCAL_ENGINE_MODULE);
      const invokeCapability=task.capabilityArtifactInvocation?async ({goal,capabilitySelection,capabilityArtifact})=>{
        const adapter=String(task.capabilityArtifactInvocation?.adapter||'');
        const invocationTask={...task,executionTarget:null,goal,requestedCapabilities:[adapter],allowedActions:['capability_invoke'],capabilitySelection,capabilityArtifact,capabilityArtifactInvocation:task.capabilityArtifactInvocation};
        const invocationResult=await (await import('./executor.mjs')).executeTask(invocationTask,{capabilities,adapters,adapterInputs,adapterEnv,adapterOverrides,verifierOverrides});
        const passed=invocationResult?.completion?.ok===true && invocationResult?.verification?.passed===true;
        return {ok:passed,result:invocationResult,evidence:{kind:'capability_invocation',passed,verifierId:invocationResult?.verification?.verifierId||null,executionState:invocationResult?.state||null,sourceRevision:capabilitySelection?.revision||null}};
      }:null;
      const inferenceEvidence=[];
      const capabilityProvider=buildCapabilityInferenceProvider(task,{capabilities,adapters,adapterInputs,adapterEnv,adapterOverrides,verifierOverrides,evidenceLog:inferenceEvidence});
      const result=await runEliteEngine(task.goal,{
        root:resolvedRoot,
        isolate:input.localIsolate!==false,
        capabilitySelection:task.capabilitySelection||null,
        capabilityArtifact:task.capabilityArtifact||null,
        invokeCapability,
        policy:{project:task.project||'ai-operating-operator',requireVerification:true,requireReview:true,maxRepairs:3},
        provider:typeof input.provider==='function'?input.provider:capabilityProvider
      });
      if(inferenceEvidence.length) result.evidence=[...(Array.isArray(result.evidence)?result.evidence:[]),...inferenceEvidence];
      const verificationPassed=['TASK_VERIFIED','VERIFIED','VERIFIED_NOOP','NOOP_VERIFIED'].includes(result?.status)&&Boolean(result?.evidence);
      const report={taskId:task.taskId,state:'EVIDENCE_CAPTURED',evidence:[evidence('action',{adapter:'elite-local-engine',status:result?.status,changedFiles:result?.changedFiles||[]}),...(Array.isArray(result?.evidence)?result.evidence:[]),evidence('verification',{verifierId:'elite-engine-independent-verification',passed:verificationPassed,errors:verificationPassed?[]:['elite_engine_not_verified']}),evidence('independent_verification',{verifierId:'elite-engine-independent-verification',passed:verificationPassed,errors:verificationPassed?[]:['elite_engine_not_verified']})],verification:{verifierId:'elite-engine-independent-verification',passed:verificationPassed,errors:verificationPassed?[]:['elite_engine_not_verified']}};
      return {...report,completion:verifyCompletion(task,report),result};
    }catch(error){
      return {ok:false,state:'FAILED',taskId:task.taskId,evidence:[evidence('action',{adapter:'elite-local-engine',accepted:false,reason:error.message})],reason:error.message};
    }
  }
  if(!url) return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'ELITE_EXECUTOR_URL_missing'};
  const target=safeUrl(url);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  const executionId=crypto.randomUUID();
  try{
    const response=await fetchImpl(target,{method:'POST',headers:headers(),body:JSON.stringify({
      protocol:'ai-operating-elite-v1',
      executionId,
      task
    }),signal:controller.signal});
    const body=await response.text();
    let result;
    try{result=JSON.parse(body);}catch{result={raw:body.slice(0,4000)};}
    const action=evidence('elite_dispatch',{
      executionId,
      endpoint:`${target.origin}${target.pathname}`,
      httpStatus:response.status,
      accepted:response.ok,
      eliteState:result?.state||result?.status||null
    });
    if(!response.ok) return {ok:false,state:response.status===401||response.status===403?'BLOCKED_PERMISSION':'FAILED',taskId:task.taskId,executionId,evidence:[action],result};
    const verification=result?.verification||null;
    const report={
      taskId:task.taskId,
      state:'EVIDENCE_CAPTURED',
      evidence:[action,...(Array.isArray(result?.evidence)?result.evidence:[])],
      verification
    };
    return {...report,completion:verifyCompletion(task,report),result};
  }catch(error){
    const reason=error?.name==='AbortError'?'elite_timeout':String(error?.message||error);
    return {ok:false,state:reason==='elite_timeout'?'BLOCKED_EXTERNAL_DEPENDENCY':'FAILED',taskId:task.taskId,executionId,evidence:[evidence('elite_dispatch',{executionId,accepted:false,reason})],reason};
  }finally{clearTimeout(timer);}
}
