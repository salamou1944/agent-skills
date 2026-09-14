import assert from 'node:assert/strict';
import { createProductDNA, checkProductIntegrity, compileCreativeInstruction, validateCreativeOutput, providerStatus } from './creative-core.mjs';

const dna = createProductDNA({
  assetId: 'boot-gate',
  asset: { mimeType: 'image/jpeg', fileName: 'boot-gate.jpg', width: 100, height: 100, bytes: 1 },
  observations: {
    category: 'test-product', type: 'test', brandName: 'BOOT-GATE',
    printedText: ['BOOT-GATE'], logo: 'test-logo', color: ['black'],
    shape: 'test-shape', components: ['body'], designDetails: ['test-detail'], material: ['test-material'],
  },
});
assert.equal(checkProductIntegrity(dna, { immutable: dna.immutable }).decision, 'PASS');
assert.equal(checkProductIntegrity(dna, { immutable: { ...dna.immutable, color: ['red'] } }).decision, 'BLOCK');
assert.equal(checkProductIntegrity(dna, { immutable: { ...dna.immutable, printedText: ['ALTERED'] } }).decision, 'BLOCK');
const compiled = compileCreativeInstruction(dna, { direction: 'boot verification' });
assert.equal(compiled.instruction.output.generationEnabled, false);
assert.equal(validateCreativeOutput(dna, { immutable: dna.immutable, claims: ['observed: test'] }).decision, 'PASS');
assert.equal(validateCreativeOutput(dna, { immutable: dna.immutable, claims: ['unverified superiority claim'] }).decision, 'BLOCK');
assert.equal(providerStatus().status, 'DISABLED');
console.log(JSON.stringify({ gate: 'creative-boot', status: 'PASS', generationEnabled: false, integrity: 'FAIL-CLOSED' }));
