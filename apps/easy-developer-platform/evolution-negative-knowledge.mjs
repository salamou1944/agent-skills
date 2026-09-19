import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export async function recordNegativeKnowledge(path,entry){
  if(!entry||typeof entry.project_id!=='string'||!entry.experiment_id)throw new Error('negative_knowledge_identity_required');
  const normalized={timestamp:new Date().toISOString(),...entry};
  const target=resolve(path);
  await mkdir(dirname(target),{recursive:true});
  await appendFile(target,JSON.stringify(normalized)+'\n','utf8');
  return normalized;
}
