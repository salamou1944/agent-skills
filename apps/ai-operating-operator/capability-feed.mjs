import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {runCapabilitySources} from './adapters/capability-sources-adapter.mjs';
import {syncCollectionSources} from './collection-source-feed.mjs';

const DEFAULT_INTERVAL_MS=Number(process.env.OPERATOR_FEED_INTERVAL_MS||900000);
const DEFAULT_DIR=process.env.OPERATOR_FEED_DIR||'/tmp/ai-operating-operator-feed';
let state={started:false,running:false,lastRunAt:null,lastSuccessAt:null,lastError:null,sourceCount:0,documents:0,changed:0,collectionSourceCount:0,collectionDocumentCount:0,collectionFailures:0};
let cache=new Map();
let timer=null;
function digest(text){return crypto.createHash('sha256').update(text,'utf8').digest('hex');}
async function writeSnapshot(dir,id,payload){await fs.mkdir(dir,{recursive:true});const tmp=path.join(dir,id+'.json.tmp');const dst=path.join(dir,id+'.json');await fs.writeFile(tmp,JSON.stringify(payload,null,2),'utf8');await fs.rename(tmp,dst);}
async function readSnapshot(dir,id){try{return JSON.parse(await fs.readFile(path.join(dir,id+'.json'),'utf8'));}catch{return null;}}

export async function syncCapabilityFeed({dir=DEFAULT_DIR,runSources=runCapabilitySources,syncCollections=syncCollectionSources}={}){
  if(state.running)return {ok:false,skipped:true,state};
  state.running=true;state.lastRunAt=new Date().toISOString();state.lastError=null;
  let changed=0,documents=0,capabilityCount=0;
  try{
    const task={allowedActions:['capability_sources_read']};
    const listed=await runSources({task,action:'sources'});
    const next=new Map();
    for(const source of listed.result.sources){
      for(const file of source.files){
        const r=await runSources({task,action:'inspect',source:source.id,file,maxBytes:2000000});
        const content=String(r.result.preview||'');
        const item={source:source.id,repo:source.repo,file,revision:source.revision,sha256:digest(content),bytes:Buffer.byteLength(content,'utf8'),fetchedAt:new Date().toISOString(),content};
        next.set(source.id+'::'+file,item);
        const id=source.id+'--'+file.replace(/[^a-zA-Z0-9._-]/g,'_');
        const old=cache.get(source.id+'::'+file)||await readSnapshot(dir,id);
        if(!old||old.sha256!==item.sha256)changed++;
        await writeSnapshot(dir,id,item);documents++;
      }
    }
    const collection=await syncCollections({limit:Number(process.env.OPERATOR_COLLECTION_SOURCE_LIMIT||60)});
    for(const item of collection.documents){
      next.set(item.source+'::'+item.repo+'::'+item.file,item);
      const id='collection--'+item.repo.replace(/[^a-zA-Z0-9._-]/g,'_')+'--'+item.file;
      const old=cache.get(item.source+'::'+item.repo+'::'+item.file)||await readSnapshot(dir,id);
      if(!old||old.sha256!==item.sha256)changed++;
      await writeSnapshot(dir,id,item);documents++;
    }
    for(const capability of (collection.capabilities||[])){
      const key='collection_capability::'+capability.id;
      const content=JSON.stringify(capability);
      const item={...capability,source:'collection_capability_inventory',file:'capability-inventory.json',content,sha256:digest(content),bytes:Buffer.byteLength(content,'utf8'),fetchedAt:new Date().toISOString()};
      next.set(key,item);capabilityCount++;
    }
    cache=next;
    state={...state,started:true,running:false,lastSuccessAt:new Date().toISOString(),sourceCount:listed.result.sources.length,documents,changed,collectionSourceCount:collection.discoveredCount,collectionDocumentCount:collection.documents.length,collectionCapabilityCount:capabilityCount,collectionFailures:collection.failures.length};
    return {ok:true,state};
  }catch(error){
    state={...state,running:false,lastError:String(error?.message||error)};
    return {ok:false,state};
  }
}
export function startCapabilityFeed(opts={}){if(timer)return {started:true,state};const intervalMs=Math.max(60000,Number(opts.intervalMs||DEFAULT_INTERVAL_MS));state.started=true;void syncCapabilityFeed(opts);timer=setInterval(()=>void syncCapabilityFeed(opts),intervalMs);timer.unref?.();return {started:true,intervalMs,state};}
export function stopCapabilityFeed(){if(timer)clearInterval(timer);timer=null;state={...state,started:false};return state;}
export function getCapabilityFeedStatus(){return {...state,cacheEntries:cache.size};}
export async function searchCapabilityCandidates({query,limit=20}={}){const q=String(query||'').trim().toLowerCase();if(!q)throw new Error('query_required');const terms=q.split(/\s+/).filter(Boolean);const candidates=[...cache.values()].filter(x=>x.source==='collection_capability_inventory');const results=[];for(const item of candidates){const hay=[item.id,item.repo,item.capabilityType,item.capability,item.evidenceLevel,item.compatibility,item.dedupeKey].filter(Boolean).join(' ').toLowerCase();if(terms.every(t=>hay.includes(t)))results.push({id:item.id,repo:item.repo,revision:item.revision,capabilityType:item.capabilityType,capability:item.capability,evidenceLevel:item.evidenceLevel,license:item.license,securityNotes:item.securityNotes,compatibility:item.compatibility,dedupeKey:item.dedupeKey,artifact:item.artifact||null,invocation:item.invocation||null,invocationStatus:item.invocation?.adapter?'DECLARED_ADAPTER':'DISCOVERY_ONLY',adapterId:item.invocation?.adapter||null});if(results.length>=Math.min(Math.max(Number(limit||20),1),100))break;}return results;}
export async function getCapabilityFeedDocuments({source=null,file=null,dir=DEFAULT_DIR}={}){if(cache.size===0){const entries=await fs.readdir(dir).catch(()=>[]);for(const name of entries.filter(x=>x.endsWith('.json'))){try{const item=JSON.parse(await fs.readFile(path.join(dir,name),'utf8'));cache.set(item.source+'::'+item.file,item);}catch{}}}return [...cache.values()].filter(x=>(!source||x.source===source)&&(!file||x.file===file));}
export async function searchCapabilityFeed({query,source=null,limit=20}={}){const q=String(query||'').trim().toLowerCase();if(!q)throw new Error('query_required');const terms=q.split(/\s+/).filter(Boolean);const docs=await getCapabilityFeedDocuments({source});const results=[];for(const doc of docs)for(const line of doc.content.split('\n')){const clean=line.trim();if(!clean)continue;const hay=clean.toLowerCase();if(terms.every(t=>hay.includes(t))){results.push({source:doc.source,repo:doc.repo,file:doc.file,revision:doc.revision,sha256:doc.sha256,line:clean.slice(0,1000)});if(results.length>=Math.min(Math.max(Number(limit||20),1),100))return results;}}return results;}
