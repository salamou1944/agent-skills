import { dispatchToElite } from '../ai-operating-operator/elite-bridge.mjs';
import { prepareTaskForExecution, hydrateCapabilityArtifact } from '../ai-operating-operator/worker.mjs';
import { syncCapabilityFeed } from '../ai-operating-operator/capability-feed.mjs';
import { execute as autonomousExecute } from './autonomous-coder.mjs';

const OLLAMA='ai.local.ollama';

export async function executeQueueTask(task,{
  botExecutor=dispatchToElite,
  providerExecutor=autonomousExecute,
  prepare=prepareTaskForExecution,
  hydrate=hydrateCapabilityArtifact,
  syncFeed=syncCapabilityFeed,
  botOptions={}
}={}){
  const evidence=[];
  if(task.executionTarget==='elite'&&task.capabilityQuery){
    try{
      const feed=await syncFeed();
      evidence.push({kind:'bot-capability-feed',ok:feed?.ok===true,state:feed?.state||null});
    }catch(error){
      evidence.push({kind:'bot-capability-feed',ok:false,error:String(error?.message||error)});
    }
    try{
      const prepared=await prepare(task);
      evidence.push({kind:'bot-capability-selection',ok:prepared.ok===true,decision:prepared.selection?.decision||null,selectedId:prepared.selection?.selected?.id||null,adapter:prepared.task?.capabilityArtifactInvocation?.adapter||null});
      const invocationAdapter=prepared.task?.capabilityArtifactInvocation?.adapter||prepared.task?.capabilitySelection?.invocation?.adapter||null;
      if(prepared.ok===true&&invocationAdapter===OLLAMA){
        const artifact=await hydrate(prepared.task.capabilitySelection,{file:prepared.task.capabilityArtifactFile||'README.md',expectedSha256:prepared.task.capabilityArtifactSha256||null});
        evidence.push({kind:'bot-capability-artifact',ok:artifact.ok===true,state:artifact.state||null,reason:artifact.reason||null});
        if(artifact.ok===true){
          const result=await botExecutor({...prepared.task,capabilityArtifact:artifact.artifact},{
            capabilities:{[OLLAMA]:{authorized:true,reachable:true}},
            adapters:{[OLLAMA]:{status:'ADAPTER_READY'}},
            adapterInputs:{
              [OLLAMA]:{
                action:'chat',
                arguments:{
                  model:process.env.OPERATOR_OLLAMA_MODEL||'llama3.2',
                  stream:false
                }
              }
            },
            ...botOptions
          });
          const verified=result?.completion?.ok===true&&result?.verification?.passed===true;
          evidence.push({kind:'bot-elite-execution',ok:verified,state:result?.state||null,status:result?.result?.status||null});
          if(verified)return {...result,executionPath:'bot-backed-elite',evidence:[...(result.evidence||[]),...evidence]};
          if(result?.state==='FAILED')evidence.push({kind:'bot-elite-fallback',reason:'bot-backed-elite-did-not-verify'});
        }
      }
    }catch(error){
      evidence.push({kind:'bot-elite-fallback',ok:false,error:String(error?.message||error)});
    }
  }
  const coding=await providerExecutor(task.goal);
  return {...coding,executionPath:'provider-fallback',evidence:[...(coding.evidence||[]),...evidence]};
}
