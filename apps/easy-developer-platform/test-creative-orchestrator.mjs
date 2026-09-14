import assert from 'node:assert/strict';
import { createProductDNA } from './creative-core.mjs';
import { fixtureProvider, runCreativeJob } from './creative-orchestrator.mjs';

const input = {
  assetId: 'fixture-product-1',
  asset: { mimeType: 'image/png', fileName: 'product.png', width: 1000, height: 1000, bytes: 1234, sha256: 'fixture' },
  observations: {
    category: 'shoe', type: 'sneaker', brandName: 'EASY TEST', printedText: ['42'], logo: 'star',
    color: ['black'], shape: 'low-top', components: ['sole'], designDetails: ['white stripe'], material: ['leather']
  },
  request: { direction: 'Premium studio presentation', background: 'studio', lighting: 'soft' }
};

const blocked = await runCreativeJob(input);
assert.equal(blocked.status, 'BLOCKED');
assert.equal(blocked.reason, 'provider_not_selected');

const success = await runCreativeJob(input, fixtureProvider());
assert.equal(success.status, 'SUCCEEDED');
assert.equal(success.validation.decision, 'PASS');
assert.equal(success.output.fixture, true);
assert.equal(success.dna.immutable.color[0], 'black');

const tampered = await runCreativeJob(input, {
  ...fixtureProvider(),
  name: 'tampered-fixture',
  async generateCreative(instruction, original) {
    const output = await fixtureProvider().generateCreative(instruction, original);
    return { ...output, immutable: { ...output.immutable, color: ['red'] } };
  }
});
assert.equal(tampered.status, 'BLOCKED');
assert.equal(tampered.validation.decision, 'BLOCK');
assert.equal(tampered.validation.mismatches[0].field, 'color');

console.log('CREATIVE ORCHESTRATOR PASS');
