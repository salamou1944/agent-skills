import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const RELEASE_GATE_VERSION='1.0.0';

function hashSelf(){return createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');}
export function evaluateReleaseEvidence(evidence={}){
  const gateHash=hashSelf();
  const required=['heldout_status','independent_status','baseline_revision','candidate_diff_hash'];
  const missing=required.filter(k=>evidence[k]===undefined||evidence[k]===null||evidence[k]==='');
  if(missing.length)return {status:'BLOCKED',reason:'missing_release_evidence',missing,gateVersion:RELEASE_GATE_VERSION,gateHash};
  if(evidence.heldout_status!=='HELDOUT_VERIFIED'||evidence.independent_status!=='INDEPENDENTLY_VERIFIED')return {status:'BLOCKED',reason:'verification_not_complete',gateVersion:RELEASE_GATE_VERSION,gateHash};
  if(!/^[a-f0-9]{40}$/.test(String(evidence.baseline_revision))&&!/^[a-f0-9]{64}$/.test(String(evidence.baseline_revision)))return {status:'BLOCKED',reason:'invalid_baseline_revision',gateVersion:RELEASE_GATE_VERSION,gateHash};
  if(!/^[a-f0-9]{64}$/.test(String(evidence.candidate_diff_hash)))return {status:'BLOCKED',reason:'invalid_candidate_diff_hash',gateVersion:RELEASE_GATE_VERSION,gateHash};
  if(evidence.production_authorization!==true)return {status:'BLOCKED',reason:'explicit_production_authorization_required',gateVersion:RELEASE_GATE_VERSION,gateHash};
  return {status:'RELEASE_ELIGIBLE',gateVersion:RELEASE_GATE_VERSION,gateHash,baselineRevision:evidence.baseline_revision,candidateDiffHash:evidence.candidate_diff_hash};
}
