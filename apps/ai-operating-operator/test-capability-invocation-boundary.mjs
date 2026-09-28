import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {validateCapabilityInvocation,buildCapabilityInvocation} from './capability-invocation.mjs';

const content='verified capability fixture';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
const revision='0123456789abcdef0123456789abcdef01234567';
const selection={capabilityType:'skill',artifact:{sha256},invocation:{mode:'prompt',adapter:'ai.local.ollama',action:'chat',contractVersion:'capability-invocation-v1'}};
assert.equal(validateCapabilityInvocation(selection).ok,true);
const invocation=buildCapabilityInvocation(selection,{repo:'example/repo',revision,file:'SKILL.md',sha256,bytes:content.length,content});
assert.equal(invocation.ok,true);
assert.equal(invocation.invocation.artifact.sha256,sha256);
assert.equal(buildCapabilityInvocation(selection,{repo:'example/repo',revision,file:'SKILL.md',sha256:'0'.repeat(64),bytes:content.length,content}).ok,false);
assert.equal(validateCapabilityInvocation({...selection,invocation:{mode:'arbitrary_exec',adapter:'x',action:'exec',contractVersion:'capability-invocation-v1'}}).ok,false);
assert.equal(validateCapabilityInvocation({...selection,invocation:{mode:'prompt',adapter:'unknown.adapter',action:'chat',contractVersion:'capability-invocation-v1'}}).ok,false);
console.log(JSON.stringify({ok:true,invocation:'PASS',checksumGate:'PASS',provenance:'PASS',arbitraryExecution:'BLOCKED'}));
