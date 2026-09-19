import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

function sha256(value){return createHash('sha256').update(value).digest('hex')}
export function bundleId(input){return 'evidence-'+sha256(JSON.stringify(input)).slice(0,20)}
export async function fileDigest(path){return sha256(await readFile(path))}
export async function buildEvidenceBundle({experimentId,baseSha,candidate,results,policy,environment={}}={}){
  const payload={
    schema:'army14-evolution-lab/evidence/v1',experimentId,createdAt:new Date().toISOString(),baseSha,
    candidate:{id:candidate?.id||null,hypothesis:candidate?.plan?.hypothesis||candidate?.hypothesis||null,target:candidate?.plan?.target||candidate?.target||null,changedFiles:(candidate?.plan?.changes||candidate?.changes||[]).map(x=>x.path),planDigest:sha256(JSON.stringify(candidate?.plan||candidate))},
    results,policy,environment:{node:process.version,platform:process.platform,...environment},
  };
  return {...payload,id:bundleId(payload),digest:sha256(JSON.stringify(payload))};
}
export async function persistEvidence(bundle,path='.lab/results/evidence-bundle.json'){
  await mkdir(dirname(path),{recursive:true}); await writeFile(path,JSON.stringify(bundle,null,2)); return path;
}
