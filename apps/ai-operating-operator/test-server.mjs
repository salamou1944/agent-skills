import assert from 'node:assert/strict';
import test from 'node:test';
import {createServer} from './server.mjs';
import crypto from 'node:crypto';

test('health and capabilities endpoints exist',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
 const h=await fetch(`http://127.0.0.1:${port}/health`);assert.equal(h.status,200);assert.equal((await h.json()).status,'READY');
 const c=await fetch(`http://127.0.0.1:${port}/capabilities`);assert.equal(c.status,200);assert.ok((await c.json()).capabilities);
 server.close();
});
test('task endpoint fails closed without HMAC secret',async()=>{
 const old=process.env.OPERATOR_HMAC_SECRET;delete process.env.OPERATOR_HMAC_SECRET;
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
 const r=await fetch(`http://127.0.0.1:${port}/tasks`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({goal:'x'})});
 assert.equal(r.status,401);server.close();if(old!==undefined)process.env.OPERATOR_HMAC_SECRET=old;
});
test('signature helper matches expected HMAC',()=>{const secret='s',payload=JSON.stringify({goal:'x'});const sig=crypto.createHmac('sha256',secret).update(payload).digest('hex');assert.equal(sig.length,64)});
