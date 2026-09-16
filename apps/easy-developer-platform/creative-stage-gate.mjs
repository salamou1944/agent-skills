import assert from 'node:assert/strict';
import { fixtureProvider, runCreativeJob } from './creative-orchestrator.mjs';

const base = { assetId:'stage-gate', asset:{mimeType:'image/png',fileName:'p.png',width:640,height:640,bytes:1,sha256:'x'}, observations:{category:'bag',type:'handbag',brandName:'TEST',printedText:['TEST'],logo:'mark',color:['blue'],shape:'rectangle',components:['strap'],designDetails:['stitching'],material:['leather']}, request:{direction:'luxury studio'} };

const noProvider = await runCreativeJob(base);
assert.equal(noProvider.decision,'BLOCK');
assert.equal(noProvider.status,'BLOCKED');

const good = await runCreativeJob(base, fixtureProvider());
assert.equal(good.decision,'PASS');
assert.equal(good.status,'SUCCEEDED');
assert.deepEqual(good.events.map(e=>e.stage), ['provider','product-dna','compile','generation','integrity','delivery']);

const attack = await runCreativeJob(base, {
  ...fixtureProvider(), name:'integrity-attack',
  async generateCreative(instruction,input){
    return { ...(await fixtureProvider().generateCreative(instruction,input)), immutable:{...instruction.immutable, logo:'forged'} };
  }
});
assert.equal(attack.decision,'BLOCK');
assert.equal(attack.validation.reason,'immutable-product-change-detected');

console.log('CREATIVE STAGE GATE PASS');
