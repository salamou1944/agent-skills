import { createHash } from 'node:crypto';

const FORBIDDEN = /(^|\\/)(?:test|tests|__tests__|\.github\\/workflows)(?:\\/|$)/i;
export function createBlindManifest({candidateFiles=[],evaluatorFiles=[]}={}){
  const candidate=new Set(candidateFiles.map(String));
  const overlap=evaluatorFiles.map(String).filter(p=>candidate.has(p));
  const forbidden=evaluatorFiles.map(String).filter(p=>FORBIDDEN.test(p));
  const manifest={candidateFiles:[...candidate],evaluatorFiles:[...new Set(evaluatorFiles.map(String))],overlap,forbidden};
  manifest.ok=overlap.length===0 && forbidden.length===0;
  manifest.digest=createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  return manifest;
}
export function assertBlind(manifest){ if(!manifest?.ok) throw new Error('BLIND_EVALUATION_VIOLATION'); return manifest; }
