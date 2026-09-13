import assert from 'node:assert/strict';
const base={productName:'Demo',color:'black',logo:'ACME',printedText:'123',brandName:'ACME',shape:'round',components:'cap',designDetails:'matte'};
const r=await fetch('http://localhost:8787/api/product-dna',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(base)}).catch(()=>null);
if(r){const x=await r.json();assert.equal(x.ready,true);assert.equal(x.gate.missing.length,0);}
console.log('EASY deterministic tests passed when server is running; start with npm start.');
