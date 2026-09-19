import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

function hash(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex')}

export async function recordNegativeKnowledge(path,entry){
  if(!entry||typeof entry.project_id!=='string'||!entry.experiment_id)throw new Error('negative_knowledge_identity_required');
  const target=resolve(path);
  await mkdir(dirname(target),{recursive:true});
  let previous=null;
  try{const text=await readFile(target,'utf8');const rows=text.trim().split('\n').filter(Boolean);if(rows.length)previous=JSON.parse(rows.at(-1))}catch{}
  const normalized={timestamp:new Date().toISOString(),...entry,prev_hash:previous?.entry_hash||null};
  normalized.entry_hash=hash(normalized);
  await appendFile(target,JSON.stringify(normalized)+'\n','utf8');
  return normalized;
}
