import assert from 'node:assert/strict';
import {discoverCollectionRepositories,fetchCollectionSource} from './collection-source-feed.mjs';

const calls=[];
const fakeFetch=async(url)=>{
  calls.push(url);
  if(url.includes('/COLLECTION/INDEX.md')) return new Response('# x\nhttps://github.com/foo/one\nhttps://github.com/foo/two\n',{status:200});
  if(url.includes('/COLLECTION/AI/AI_INDEX.md')) return new Response('https://github.com/foo/two\nhttps://github.com/bar/three\n',{status:200});
  if(url.includes('/COLLECTION/SOURCES/AI_DISCOVERY_SOURCES.md')) return new Response('https://github.com/foo/one\n',{status:200});
  if(url.includes('/COLLECTION/DOCUMENTS/DOCUMENT_OCR_INDEX.md')) return new Response('https://github.com/bar/three\n',{status:200});
  if(url.endsWith('/repos/foo/one')) return new Response(JSON.stringify({default_branch:'main'}),{status:200});
  if(url.endsWith('/repos/foo/one/branches/main')) return new Response(JSON.stringify({commit:{sha:'rev-one'}}),{status:200});
  if(url.endsWith('/foo/one/rev-one/README.md')) return new Response('# One\ncapability\n',{status:200});
  throw new Error('unexpected:'+url);
};
const repos=await discoverCollectionRepositories({fetchImpl:fakeFetch,limit:10});
assert.deepEqual(repos.map(x=>x.repo),['foo/one','foo/two','bar/three']);
const doc=await fetchCollectionSource(repos[0],{fetchImpl:fakeFetch});
assert.equal(doc.repo,'foo/one');
assert.equal(doc.revision,'rev-one');
assert.equal(doc.file,'README.md');
assert.equal(doc.sha256.length,64);
assert.ok(doc.discoveredFrom.file);
assert.ok(calls.length>0);
console.log(JSON.stringify({ok:true,discovered:repos.length,revision:doc.revision}));
