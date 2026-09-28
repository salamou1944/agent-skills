import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT=path.dirname(new URL(import.meta.url).pathname);

async function loadRegistry(){
  return JSON.parse(await fs.readFile(path.join(ROOT,'adapter-registry.json'),'utf8'));
}

export async function resolveCapabilityInvocation(selection,{registry=null}={}) {
  if(!selection) return {ok:true,mode:'none',binding:null};
  const invocation=selection.invocation;
  if(!invocation || invocation.mode!=='adapter' || !invocation.adapter) {
    return {ok:false,state:'DISCOVERY_ONLY',reason:'capability_invocation_not_declared'};
  }
  const data=registry||await loadRegistry();
  const entry=data.adapters?.[invocation.adapter];
  if(!entry || entry.status!=='ADAPTER_READY') {
    return {ok:false,state:'BLOCKED_PERMISSION',reason:'capability_adapter_not_registered',adapter:invocation.adapter};
  }
  if(invocation.verifier && invocation.verifier!==entry.independentVerifier) {
    return {ok:false,state:'BLOCKED_PERMISSION',reason:'capability_verifier_mismatch',adapter:invocation.adapter};
  }
  return {
    ok:true,
    mode:'adapter',
    binding:{
      adapter:invocation.adapter,
      verifier:entry.independentVerifier,
      artifactRole:invocation.artifactRole||'input'
    }
  };
}

export function assertCapabilityInvocation(binding,{task}={}) {
  if(!binding?.adapter) throw new Error('capability_invocation_binding_required');
  if(!task?.capabilitySelection?.id) throw new Error('capability_selection_required');
  return true;
}
