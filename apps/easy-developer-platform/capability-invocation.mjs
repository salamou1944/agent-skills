import crypto from 'node:crypto';

const INVOCATION_MODES=Object.freeze({
  skill_prompt:{
    capabilityType:'skill',
    verifierId:'elite-capability-invocation-v1'
  }
});

function fail(code){
  const error=new Error(code);
  error.code=code;
  throw error;
}

export function validateCapabilityInvocation(selection,artifact){
  if(!selection||!artifact) return {ok:false,reason:'capability_invocation_artifact_missing'};
  const invocation=selection.invocation;
  if(!invocation?.mode) return {ok:false,reason:'capability_invocation_mode_missing'};
  const contract=INVOCATION_MODES[invocation.mode];
  if(!contract) return {ok:false,reason:'capability_invocation_mode_not_allowlisted'};
  if(invocation.adapterId!=='elite.skill-prompt-v1') return {ok:false,reason:'capability_invocation_adapter_not_allowlisted'};
  if(invocation.verifierId!==contract.verifierId) return {ok:false,reason:'capability_invocation_verifier_mismatch'};
  if(selection.capabilityType!==contract.capabilityType) return {ok:false,reason:'capability_invocation_type_mismatch'};
  if(!/^VERIFIED/.test(String(selection.evidenceLevel||''))) return {ok:false,reason:'capability_invocation_evidence_not_verified'};
  if(!selection.license||/unknown|unresolved|not found/i.test(String(selection.license))) return {ok:false,reason:'capability_invocation_license_unresolved'};
  if(!artifact.repo||artifact.repo!==selection.repo||artifact.revision!==selection.revision) return {ok:false,reason:'capability_invocation_provenance_mismatch'};
  if(!/^[0-9a-f]{40}$/.test(String(artifact.revision||''))) return {ok:false,reason:'capability_invocation_revision_not_pinned'};
  if(!/^[0-9a-f]{64}$/.test(String(artifact.sha256||''))||typeof artifact.content!=='string') return {ok:false,reason:'capability_invocation_artifact_invalid'};
  if(String(artifact.file||'').includes('..')||String(artifact.file||'').startsWith('/')) return {ok:false,reason:'capability_invocation_path_invalid'};
  const actualSha=crypto.createHash('sha256').update(artifact.content,'utf8').digest('hex');
  if(actualSha!==artifact.sha256) return {ok:false,reason:'capability_invocation_checksum_mismatch'};
  if(!/\.md$/i.test(String(artifact.file||''))) return {ok:false,reason:'capability_invocation_artifact_type_not_allowed'};
  return {ok:true,contract};
}

export function invokeVerifiedCapability(selection,artifact){
  const gate=validateCapabilityInvocation(selection,artifact);
  if(!gate.ok) return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:gate.reason};
  const content=artifact.content;
  return {
    ok:true,
    state:'INVOKED',
    invocation:{
      mode:selection.invocation.mode,
      adapterId:selection.invocation.adapterId,
      verifierId:selection.invocation.verifierId,
      capabilityId:selection.id,
      repo:artifact.repo,
      revision:artifact.revision,
      file:artifact.file,
      sha256:artifact.sha256,
      bytes:Buffer.byteLength(content,'utf8')
    },
    promptContext:content
  };
}

export function verifyCapabilityInvocation(result){
  const passed=Boolean(
    result?.ok===true &&
    result?.state==='INVOKED' &&
    result?.invocation?.adapterId==='elite.skill-prompt-v1' &&
    result?.invocation?.verifierId==='elite-capability-invocation-v1' &&
    /^[0-9a-f]{40}$/.test(String(result?.invocation?.revision||'')) &&
    /^[0-9a-f]{64}$/.test(String(result?.invocation?.sha256||'')) &&
    typeof result?.promptContext==='string'
  );
  return {verifierId:'elite-capability-invocation-v1',passed,errors:passed?[]:['invalid_capability_invocation_evidence']};
}
