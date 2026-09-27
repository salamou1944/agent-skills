import assert from 'node:assert/strict';
import {syncCapabilityFeed,getCapabilityFeedStatus,searchCapabilityFeed,stopCapabilityFeed} from './capability-feed.mjs';

const r=await syncCapabilityFeed({dir:'/tmp/ai-operating-operator-test-feed'});
assert.equal(r.ok,true);
assert.equal(r.state.sourceCount,5);
assert.equal(r.state.documents>0,true);
const status=getCapabilityFeedStatus();
assert.equal(status.lastSuccessAt!==null,true);
const hits=await searchCapabilityFeed({query:'MCP',limit:5});
assert.equal(Array.isArray(hits),true);
assert.equal(hits.length>0,true);
stopCapabilityFeed();
console.log(JSON.stringify({ok:true,sourceCount:status.sourceCount,documents:status.documents}));
