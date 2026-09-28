import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {searchCapabilityCandidates} from './capability-feed.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const VERIFIED_PREFIX='VERIFIED';
const BLOCKED_SECURITY=/prompt injection|data exfiltration|credential theft|malware|unauthorized/i;

async function loadInvocationRegistry(){
  return JSON.parse(await fs.readFile(path.join(ROOT,'capability-invocation-registry.json'),'utf8'));
}

function resolveInvocation(candidate,registry){
  const entry=registry?.capabilities?.[candidate?.id];
  if(!entry)return null;
  if(entry.repo!==candidate.repo||entry.revision!==candidate.revision)return null;
  return {
    mode:entry.mode,
    adapter:entry.adapter,
    action:entry.action,
    contractVersion:entry.contractVersion
  };
}

export function evaluateCapabilityCandidate(candidate,{compatibility=null,allowedLicenses=null}={}){
  const reasons=[];
  if(!candidate?.id||!candidate?.repo||!candidate?.revision)reasons.push('identity_incomplete');
  if(!String(candidate?.evidenceLevel||'').startsWith(VERIFIED_PREFIX))reasons.push('evidence_not_verified');
  const license=String(candidate?.license||'').trim();
  if(!license||/unknown|unresolved|not found/i.test(license))reasons.push('license_unresolved');
  if(Array.isArray(allowedLicenses)&&allowedLicenses.length&&!allowedLicenses.includes(license))reasons.push('license_not_allowed');
  if(compatibility&&candidate.compatibility&&String(candidate.compatibility).toLowerCase()!==String(compatibility).toLowerCase())reasons.push('compatibility_mismatch');
  if(BLOCKED_SECURITY.test(String(candidate?.securityNotes||'')))reasons.push('security_review_required');
  return {eligible:reasons.length===0,reasons};
}

export async function selectVerifiedCapability({query,compatibility=null,allowedLicenses=null,limit=20,search=searchCapabilityCandidates}={}){
  const candidates=await search({query,limit});
  const registry=await loadInvocationRegistry();
  const evaluated=candidates.map(candidate=>{
    const invocation=resolveInvocation(candidate,registry);
    return {...candidate,invocation,gate:evaluateCapabilityCandidate(candidate,{compatibility,allowedLicenses})};
  });
  const selected=evaluated.find(x=>x.gate.eligible)||null;
  if(!selected)return {decision:'BLOCKED_EXTERNAL_DEPENDENCY',selected:null,candidates:evaluated,evidence:{query,searchedCandidates:evaluated.length,verifiedCandidates:evaluated.filter(x=>x.gate.eligible).length}};
  return {
    decision:'ADAPT_AND_VERIFY',
    selected:{
      id:selected.id,repo:selected.repo,revision:selected.revision,capabilityType:selected.capabilityType,
      capability:selected.capability,evidenceLevel:selected.evidenceLevel,license:selected.license,
      compatibility:selected.compatibility,dedupeKey:selected.dedupeKey,artifact:selected.artifact||null,
      invocation:selected.invocation
    },
    candidates:evaluated,
    evidence:{query,searchedCandidates:evaluated.length,selectedId:selected.id,sourceRevision:selected.revision,verificationStatus:selected.evidenceLevel,invocation:selected.invocation}
  };
}
