import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {searchCapabilityCandidates} from './capability-feed.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const VERIFIED_PREFIX='VERIFIED';
const BLOCKED_SECURITY=/prompt injection|data exfiltration|credential theft|malware|unauthorized/i;

async function registeredAdapters(){
  const registry=JSON.parse(await fs.readFile(path.join(ROOT,'adapter-registry.json'),'utf8'));
  return new Set(Object.entries(registry.adapters||{}).filter(([,entry])=>entry?.status==='ADAPTER_READY').map(([id])=>id));
}

export function evaluateCapabilityCandidate(candidate,{compatibility=null,allowedLicenses=null,registeredAdapterIds=new Set(),requiredAdapter=null}={}){
  const reasons=[];
  if(!candidate?.id||!candidate?.repo||!candidate?.revision)reasons.push('identity_incomplete');
  if(!String(candidate?.evidenceLevel||'').startsWith(VERIFIED_PREFIX))reasons.push('evidence_not_verified');
  const license=String(candidate?.license||'').trim();
  if(!license||/unknown|unresolved|not found/i.test(license))reasons.push('license_unresolved');
  if(Array.isArray(allowedLicenses)&&allowedLicenses.length&&!allowedLicenses.includes(license))reasons.push('license_not_allowed');
  if(compatibility&&candidate.compatibility&&String(candidate.compatibility).toLowerCase()!==String(compatibility).toLowerCase())reasons.push('compatibility_mismatch');
  if(BLOCKED_SECURITY.test(String(candidate?.securityNotes||'')))reasons.push('security_review_required');
  const invocation=candidate?.invocation||null;
  const adapterId=String(invocation?.adapter||'').trim();
  const invocationStatus=adapterId&&registeredAdapterIds.has(adapterId)?'ADAPTER_READY':'DISCOVERY_ONLY';
  if(requiredAdapter&&adapterId!==requiredAdapter)reasons.push('required_adapter_mismatch');
  if(!invocation||!adapterId)reasons.push('adapter_not_registered');
  else if(!registeredAdapterIds.has(adapterId))reasons.push('invocation_adapter_not_registered');
  if(invocation){
    if(invocation.mode!=='prompt')reasons.push('invocation_mode_not_allowed');
    if(invocation.action!=='chat')reasons.push('invocation_action_not_allowed');
    if(invocation.contractVersion!=='capability-invocation-v1')reasons.push('invocation_contract_version_invalid');
  }
  return {eligible:reasons.length===0,reasons,invocationStatus,adapterId:adapterId||null};
}

export async function selectVerifiedCapability({query,compatibility=null,allowedLicenses=null,requiredAdapter=null,limit=20,search=searchCapabilityCandidates,registeredAdapterIds=null}={}){
  const adapters=registeredAdapterIds||await registeredAdapters();
  const candidates=await search({query,limit});
  const evaluated=candidates.map(candidate=>({...candidate,gate:evaluateCapabilityCandidate(candidate,{compatibility,allowedLicenses,requiredAdapter,registeredAdapterIds:adapters})}));
  const selected=evaluated.find(x=>x.gate.eligible)||null;
  if(selected){
    return {decision:'ADAPT_AND_VERIFY',selected:{id:selected.id,repo:selected.repo,revision:selected.revision,capabilityType:selected.capabilityType,capability:selected.capability,evidenceLevel:selected.evidenceLevel,license:selected.license,compatibility:selected.compatibility,dedupeKey:selected.dedupeKey,artifact:selected.artifact||null,invocation:selected.invocation||null,invocationStatus:selected.gate.invocationStatus,adapterId:selected.gate.adapterId},candidates:evaluated,evidence:{query,searchedCandidates:evaluated.length,selectedId:selected.id,sourceRevision:selected.revision,verificationStatus:selected.evidenceLevel,invocationStatus:selected.gate.invocationStatus,adapterId:selected.gate.adapterId}};
  }
  const discovery=evaluated.find(x=>x.gate.invocationStatus==='DISCOVERY_ONLY'&&(x.gate.reasons.includes('adapter_not_registered')||x.gate.reasons.includes('invocation_adapter_not_registered')));
  if(discovery)return {decision:'DISCOVERY_ONLY',selected:{id:discovery.id,repo:discovery.repo,revision:discovery.revision,capabilityType:discovery.capabilityType,capability:discovery.capability,evidenceLevel:discovery.evidenceLevel,license:discovery.license,compatibility:discovery.compatibility,dedupeKey:discovery.dedupeKey,artifact:discovery.artifact||null,invocation:discovery.invocation||null,invocationStatus:'DISCOVERY_ONLY',adapterId:discovery.gate.adapterId},candidates:evaluated,evidence:{query,searchedCandidates:evaluated.length,selectedId:discovery.id,invocationStatus:'DISCOVERY_ONLY',reason:'adapter_not_registered'}};
  return {decision:'BLOCKED_EXTERNAL_DEPENDENCY',selected:null,candidates:evaluated,evidence:{query,searchedCandidates:evaluated.length,verifiedCandidates:evaluated.filter(x=>x.gate.eligible).length}};
}
