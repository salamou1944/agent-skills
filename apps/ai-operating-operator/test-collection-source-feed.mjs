import assert from 'node:assert/strict';
import {discoverCollectionRepositories,fetchCollectionSource,fetchCollectionCapabilityInventory} from './collection-source-feed.mjs';

const calls=[];
const fakeFetch=async(url)=>{
  calls.push(url);
  if(url.includes('/COLLECTION/INDEX.md')) return new Response('# x\nhttps://github.com/foo/one\nhttps://github.com/foo/two\nhttps://github.com/example/new-capability-source\n',{status:200});
  if(url.includes('/COLLECTION/AI/AI_INDEX.md')) return new Response('https://github.com/foo/two\nhttps://github.com/bar/three\n',{status:200});
  if(url.includes('/COLLECTION/SOURCES/AI_DISCOVERY_SOURCES.md')) return new Response('https://github.com/foo/one\n',{status:200});
  if(url.includes('/COLLECTION/DOCUMENTS/DOCUMENT_OCR_INDEX.md')) return new Response('https://github.com/bar/three\n',{status:200});
  if(url.includes('/COLLECTION/AUTO/EXTRACTED/harry0703_capability_inventory_2026-09-27.json')) return new Response(JSON.stringify({items:[]}),{status:200});
  if(url.endsWith('/repos/foo/one')) return new Response(JSON.stringify({default_branch:'main'}),{status:200});
  if(url.endsWith('/repos/foo/one/branches/main')) return new Response(JSON.stringify({commit:{sha:'rev-one'}}),{status:200});
  if(url.endsWith('/foo/one/rev-one/README.md')) return new Response('# One\ncapability\n',{status:200});
  if(url.endsWith('/repos/example/new-capability-source')) return new Response(JSON.stringify({default_branch:'main'}),{status:200});
  if(url.endsWith('/repos/example/new-capability-source/branches/main')) return new Response(JSON.stringify({commit:{sha:'0123456789abcdef0123456789abcdef01234567'}}),{status:200});
  if(url.endsWith('/example/new-capability-source/0123456789abcdef0123456789abcdef01234567/README.md')) return new Response('# New capability source\nAutomatic discovery fixture.\n',{status:200});
  throw new Error('unexpected:'+url);
};

const repos=await discoverCollectionRepositories({fetchImpl:fakeFetch,limit:10});
assert.deepEqual(repos.map(x=>x.repo),['foo/one','foo/two','example/new-capability-source','bar/three']);
const discoveredNew=repos.find(x=>x.repo==='example/new-capability-source');
assert.ok(discoveredNew);
assert.equal(discoveredNew.discoveredFrom.collectionRevision,'7dca221b4bc64082184e3508beca411b730162d6');

const doc=await fetchCollectionSource(discoveredNew,{fetchImpl:fakeFetch});
assert.equal(doc.repo,'example/new-capability-source');
assert.equal(doc.revision,'0123456789abcdef0123456789abcdef01234567');
assert.equal(doc.file,'README.md');
assert.equal(doc.content,'# New capability source\nAutomatic discovery fixture.\n');
assert.equal(doc.sha256.length,64);
assert.ok(doc.discoveredFrom.file);
assert.ok(calls.length>0);

const inventoryPayload={items:[{
  id:'cap-1',
  repo:'foo/one',
  capabilityType:'tool',
  capability:'example',
  evidenceLevel:'VERIFIED_FROM_README_LICENSE',
  dedupeKey:'github:foo/one'
}]};
const inventoryFetch=async(url)=>{
  if(url.includes('harry0703_capability_inventory_2026-09-27.json')) {
    return new Response(JSON.stringify(inventoryPayload),{status:200});
  }
  return fakeFetch(url);
};
const inventory=await fetchCollectionCapabilityInventory({fetchImpl:inventoryFetch});
assert.equal(inventory.length,1);
assert.equal(inventory[0].capabilityType,'tool');
assert.equal(inventory[0].collectionRevision,'49c086937245a6c74f3548186aeafb52bbbd476a');
console.log(JSON.stringify({ok:true,automaticDiscovery:'VERIFIED_TEST',discovered:repos.length,newSource:discoveredNew.repo,revision:doc.revision,inventoryOk:true}));

// e2e-verification-marker: automatic-discovery
