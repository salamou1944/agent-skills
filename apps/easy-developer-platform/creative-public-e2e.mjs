import assert from 'node:assert/strict';

const base = process.env.EASY_PUBLIC_URL || `http://127.0.0.1:${process.env.PORT || 8080}`;
const input = { mode:'fixture', assetId:'public-e2e', asset:{mimeType:'image/png',fileName:'product.png',width:100,height:100,bytes:1,sha256:'fixture'}, observations:{category:'test',type:'product',brandName:'EASY',printedText:['EASY'],logo:'mark',color:['black'],shape:'round',components:['body'],designDetails:['detail'],material:['metal']}, request:{direction:'studio'} };
const response = await fetch(`${base}/api/creative-job/run`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
assert.equal(response.status,200);
const result = await response.json();
assert.equal(result.status,'SUCCEEDED');
assert.equal(result.validation.decision,'PASS');
console.log('CREATIVE PUBLIC E2E PASS');
