import crypto from 'node:crypto';

const COLLECTION_REPO='salamou1944/Project-';
const COLLECTION_REVISION='79d97983a95a808c2881b2e0c21c3366ad620aa4';
const CATALOG_FILES=Object.freeze([
  'COLLECTION/INDEX.md',
  'COLLECTION/AI/AI_INDEX.md',
  'COLLECTION/SOURCES/AI_DISCOVERY_SOURCES.md',
  'COLLECTION/DOCUMENTS/DOCUMENT_OCR_INDEX.md',
  'COLLECTION/AUTO/EXTRACTED/harry0703_capability_inventory_2026-09-27.json'
]);
const API='https://api.github.com';
const RAW='https://raw.githubusercontent.com';
const DEFAULT_LIMIT=Number(process.env.OPERATOR_COLLECTION_SOURCE_LIMIT||60);

function sha256(s){return crypto.createHash('sha256').update(s,'utf8').digest('hex');}
function repoFromUrl(url){
  const m=String(url).match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:\/)?(?:#.*)?$/);
  if(!m)return null;
  if(['salamou1944'].includes(m[1])) return null;
  return {owner:m[1],name:m[2],repo:m[1]+'/'+m[2]};
}
async function get(url,{fetchImpl=fetch}={}){
  const res=await fetchImpl(url,{headers:{accept:'application/vnd.github+json','user-agent':'ai-operating-operator-collection-feed'}});
  if(!res.ok)throw new Error(`collection_http_${res.status}`);
  return res;
}
export async function discoverCollectionRepositories({fetchImpl=fetch,limit=DEFAULT_LIMIT}={}){
  const repos=new Map();
  for(const file of CATALOG_FILES){
    const url=`${RAW}/${COLLECTION_REPO}/${COLLECTION_REVISION}/${file}`;
    const res=await get(url,{fetchImpl});
    const text=await res.text();
    for(const match of text.matchAll(/https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/g)){
      const repo=repoFromUrl(match[0]);
      if(repo) repos.set(repo.repo,{...repo,discoveredFrom:{file,collectionRevision:COLLECTION_REVISION}});
    }
  }
  return [...repos.values()].slice(0,Math.max(1,Math.min(Number(limit)||DEFAULT_LIMIT,200)));
}
export async function fetchCollectionSource(repo,{fetchImpl=fetch}={}){
  const meta=await get(`${API}/repos/${repo.repo}`,{fetchImpl});
  const metadata=await meta.json();
  const branch=metadata.default_branch||'main';
  const branchRes=await get(`${API}/repos/${repo.repo}/branches/${encodeURIComponent(branch)}`,{fetchImpl});
  const branchData=await branchRes.json();
  const revision=branchData.commit?.sha;
  if(!revision)throw new Error('collection_source_revision_missing');
  const raw=await get(`${RAW}/${repo.repo}/${revision}/README.md`,{fetchImpl});
  const content=await raw.text();
  return {
    source:'collection_repository',
    repo:repo.repo,
    file:'README.md',
    revision,
    sha256:sha256(content),
    bytes:Buffer.byteLength(content,'utf8'),
    collectionRevision:COLLECTION_REVISION,
    discoveredFrom:repo.discoveredFrom,
    capturedAt:new Date().toISOString(),
    content
  };
}
export async function fetchCollectionCapabilityInventory({fetchImpl=fetch}={}) {
  const url=`${RAW}/${COLLECTION_REPO}/${COLLECTION_REVISION}/COLLECTION/AUTO/EXTRACTED/harry0703_capability_inventory_2026-09-27.json`;
  const res=await get(url,{fetchImpl});
  const payload=await res.json();
  if(!Array.isArray(payload.items))throw new Error('collection_capability_inventory_invalid');
  return payload.items.map(item=>({
    ...item,
    source:'collection_capability_inventory',
    collectionRevision:COLLECTION_REVISION
  }));
}
export async function syncCollectionSources({fetchImpl=fetch,limit=DEFAULT_LIMIT}={}){
  const discovered=await discoverCollectionRepositories({fetchImpl,limit});
  const documents=[]; const failures=[];
  for(const repo of discovered){
    try{documents.push(await fetchCollectionSource(repo,{fetchImpl}));}
    catch(error){failures.push({repo:repo.repo,error:String(error?.message||error)});}
  }
  let capabilities=[];\n  try{capabilities=await fetchCollectionCapabilityInventory({fetchImpl});}\n  catch(error){failures.push({repo:COLLECTION_REPO+'/capability-inventory',error:String(error?.message||error)});}\n  return {discoveredCount:discovered.length,documents,capabilities,failures,collectionRevision:COLLECTION_REVISION};
}
