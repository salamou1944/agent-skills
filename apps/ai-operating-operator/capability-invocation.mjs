const ALLOWED_MODES=new Set(['artifact_read']);
const SAFE_TYPES=new Set(['skill','tool','component','api_gateway']);
export function validateCapabilityInvocation(selection={}){
  const invocation=selection?.invocation; const reasons=[];
  if(!invocation) reasons.push('invocation_contract_missing');
  if(invocation && !ALLOWED_MODES.has(invocation.mode)) reasons.push('invocation_mode_not_allowed');
  if(invocation && !SAFE_TYPES.has(String(selection.capabilityType||''))) reasons.push('capability_type_not_allowed');
  if(invocation && (!invocation.adapter||!invocation.verifier)) reasons.push('invocation_adapter_or_verifier_missing');
  return {ok:reasons.length===0,reasons,invocation:invocation||null};
}
export function buildCapabilityInvocation(selection,artifact){
  const gate=validateCapabilityInvocation(selection);
  if(!gate.ok)return {ok:false,state:'BLOCKED_PERMISSION',reason:gate.reasons[0],reasons:gate.reasons};
  if(!artifact?.content||artifact.sha256!==selection?.artifact?.sha256)
    return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'artifact_not_verified_for_invocation'};
  return {ok:true,invocation:{...gate.invocation,artifact:{repo:artifact.repo,revision:artifact.revision,file:artifact.file,sha256:artifact.sha256,bytes:artifact.bytes}}};
}
