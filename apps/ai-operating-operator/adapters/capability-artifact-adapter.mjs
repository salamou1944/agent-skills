import crypto from 'node:crypto';
export async function runCapabilityArtifact(input={}){
  const task=input.task||{}, artifact=task.capabilityArtifact, contract=task.capabilityInvocation||task.capabilityArtifactInvocation;
  if(!artifact||!contract) throw new Error('capability_invocation_contract_required');
  if(contract.mode!=='artifact_read') throw new Error('capability_invocation_mode_not_allowed');
  if(!artifact.repo||!artifact.revision||!artifact.file||typeof artifact.content!=='string') throw new Error('capability_artifact_invalid');
  const sha256=crypto.createHash('sha256').update(artifact.content,'utf8').digest('hex');
  if(sha256!==artifact.sha256) throw new Error('capability_artifact_checksum_mismatch');
  return {executionId:'capability-artifact-'+Date.now(),target:artifact.repo+':'+artifact.file,result:{status:200,mode:'artifact_read',invoked:true,sourceRevision:artifact.revision,sha256,bytes:Buffer.byteLength(artifact.content,'utf8')}};
}
export function verifyCapabilityArtifactResult({result}={}){
  const ok=Boolean(result?.result?.status===200&&result?.result?.invoked===true&&result.executionId&&result.target&&/^[0-9a-f]{64}$/.test(String(result.result.sha256||'')));
  return {verifierId:'capability-artifact-independent-verifier-v1',passed:ok,errors:ok?[]:['capability_artifact_invocation_not_verified']};
}
