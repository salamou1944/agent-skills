const ALLOWED_MODES=new Set(['artifact_read']);
const SAFE_TYPES=new Set(['skill','tool','component','api_gateway']);
const APPROVED_ADAPTER='capability.artifact';
const APPROVED_VERIFIER='capability-artifact-independent-verifier-v1';
export function validateCapabilityInvocation(selection={}){
  const invocation=selection?.invocation; const reasons=[];
  if(!invocation) reasons.push('invocation_contract_missing');
  if(invocation && !ALLOWED_MODES.has(invocation.mode)) reasons.push('invocation_mode_not_allowed');
  if(invocation && !SAFE_TYPES.has(String(selection.capabilityType||''))) reasons.push('capability_type_not_allowed');
  if(invocation && invocation.adapter!==APPROVED_ADAPTER) reasons.push('invocation_adapter_not_allowed');
  if(invocation && invocation.verifier!==APPROVED_VERIFIER) reasons.push('invocation_verifier_not_allowed');
  if(invocation && invocation.contractVersion!=='capability-invocation-v1') reasons.push('invocation_contract_version_invalid');
  return {ok:reasons.length===0,reasons,invocation:invocation||null};
}
export function buildCapabilityInvocation(selection,artifact){
  const gate=validateCapabilityInvocation(selection);
  if(!gate.ok)return {ok:false,state:'BLOCKED_PERMISSION',reason:gate.reasons[0],reasons:gate.reasons};
  if(!artifact?.content||artifact.sha256!==selection?.artifact?.sha256)
    return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'artifact_not_verified_for_invocation'};
  if(artifact.revision!==selection.revision||artifact.repo!==selection.repo)
    return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'artifact_provenance_mismatch'};
  return {ok:true,invocation:{...gate.invocation,artifact:{repo:artifact.repo,revision:artifact.revision,file:artifact.file,sha256:artifact.sha256,bytes:artifact.bytes}}};
}
