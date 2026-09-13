import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const server=spawn(process.execPath,['server.mjs'],{stdio:'ignore'});
try {
  await new Promise(r=>setTimeout(r,200));
  const base={productName:'Demo',color:'black',logo:'ACME',printedText:'123',brandName:'ACME',shape:'round',components:'cap',designDetails:'matte'};
  const r=await fetch('http://localhost:8787/api/product-dna',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(base)});
  const x=await r.json();
  assert.equal(x.ready,true);
  assert.equal(x.gate.missing.length,0);
  const blocked=await fetch('http://localhost:8787/api/creative/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({dna:{productName:'Demo'}})});
  assert.equal(blocked.status,409);
  console.log('EASY core tests passed');
} finally { server.kill(); }
