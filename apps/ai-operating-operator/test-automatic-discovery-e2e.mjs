import assert from 'node:assert/strict';
import {syncCapabilityFeed,searchCapabilityCandidates} from './capability-feed.mjs';

const fakeSources={
  result:{
    sources:[{
      id:'new-capability-source',
      repo:'example/new-capability-source',
      revision:'0123456789abcdef0123456789abcdef01234567',
      files:['README.md']
    }]
  }
};
const runSources=async({action})=>{
  if(action==='sources') return fakeSources;
  return {result:{preview:'# New capability source\nAutomatic discovery fixture.\n'}};
};

const capabilities=[{
  id:'cap-auto-001',
  repo:'example/new-capability-source',
  revision:'0123456789abcdef0123456789abcdef01234567',
  capabilityType:'tool',
  capability:'automatic discovery fixture',
  evidenceLevel:'VERIFIED_FROM_README_LICENSE',
  license:'MIT',
  securityNotes:'fixture only',
  compatibility:'node',
  dedupeKey:'github:example/new-capability-source:automatic-discovery-fixture'
}];

const syncCollections=async()=>({
  discoveredCount:1,
  documents:[{
    source:'collection_repository',
    repo:'example/new-capability-source',
    file:'README.md',
    revision:'0123456789abcdef0123456789abcdef01234567',
    sha256:'fixture-sha',
    bytes:48,
    collectionRevision:'49c086937245a6c74f3548186aeafb52bbbd476a',
    discoveredFrom:{file:'COLLECTION/INDEX.md',collectionRevision:'49c086937245a6c74f3548186aeafb52bbbd476a'},
    capturedAt:new Date().toISOString(),
    content:'# New capability source\nAutomatic discovery fixture.\n'
  }],
  capabilities,
  failures:[],
  collectionRevision:'49c086937245a6c74f3548186aeafb52bbbd476a'
});

const dir='/tmp/automatic-discovery-e2e';
const synced=await syncCapabilityFeed({dir,runSources,syncCollections});
assert.equal(synced.ok,true);
assert.equal(synced.state.collectionSourceCount,1);
assert.equal(synced.state.collectionCapabilityCount,1);

const found=await searchCapabilityCandidates({query:'automatic discovery fixture'});
assert.equal(found.length,1);
assert.equal(found[0].id,'cap-auto-001');
assert.equal(found[0].repo,'example/new-capability-source');
assert.equal(found[0].revision,'0123456789abcdef0123456789abcdef01234567');

console.log(JSON.stringify({
  ok:true,
  automaticDiscovery:'E2E_TEST',
  source:'example/new-capability-source',
  capability:'cap-auto-001',
  candidateSearch:'PASS'
}));
