import assert from 'node:assert/strict';
import {
  createProductDNA,
  checkProductIntegrity,
  compileCreativeInstruction,
  validateCreativeOutput,
  providerStatus,
  IMMUTABLE_FIELDS,
} from './creative-core.mjs';

const dna = createProductDNA({
  assetId: 'e2e-product-001',
  asset: { mimeType: 'image/jpeg', fileName: 'shoe.jpg', width: 1200, height: 1200, bytes: 120000 },
  observations: {
    category: 'footwear', type: 'running shoe', brandName: 'EASY TEST',
    printedText: ['EASY TEST', 'RUN 01'], logo: 'wordmark', color: ['black', 'white'],
    shape: 'low-cut athletic shoe', components: ['sole', 'laces', 'upper'],
    designDetails: ['white midsole', 'black mesh upper'], material: ['mesh', 'rubber'],
    background: 'studio', lighting: 'softbox', camera: 'three-quarter',
  },
});
assert.equal(dna.version, '0.1.0');
assert.equal(dna.immutable.brandName, 'EASY TEST');
assert.equal(typeof dna.fingerprint, 'string');
assert.equal(dna.fingerprint.length, 64);
assert.equal(IMMUTABLE_FIELDS.length, 8);

const pass = checkProductIntegrity(dna, { immutable: dna.immutable });
assert.equal(pass.decision, 'PASS');
assert.equal(pass.mismatches.length, 0);

const changedColor = checkProductIntegrity(dna, { immutable: { ...dna.immutable, color: ['red'] } });
assert.equal(changedColor.decision, 'BLOCK');
assert.ok(changedColor.mismatches.some(x => x.field === 'color'));

const changedText = checkProductIntegrity(dna, { immutable: { ...dna.immutable, printedText: ['FAKE'] } });
assert.equal(changedText.decision, 'BLOCK');
assert.ok(changedText.mismatches.some(x => x.field === 'printedText'));

const instruction = compileCreativeInstruction(dna, {
  direction: 'Premium Algerian e-commerce hero creative',
  background: 'clean architectural studio',
  lighting: 'natural daylight',
});
assert.equal(instruction.instruction.output.generationEnabled, false);
assert.equal(instruction.instruction.mode, 'provider-neutral');
assert.equal(typeof instruction.fingerprint, 'string');

const outputPass = validateCreativeOutput(dna, { immutable: dna.immutable, claims: ['observed: black and white'] });
assert.equal(outputPass.decision, 'PASS');

const outputBlock = validateCreativeOutput(dna, { immutable: dna.immutable, claims: ['best shoe in Algeria'] });
assert.equal(outputBlock.decision, 'BLOCK');
assert.deepEqual(outputBlock.inventedClaims, ['best shoe in Algeria']);

const provider = providerStatus();
assert.equal(provider.status, 'READY');
assert.equal(provider.provider, 'local-safe-presenter');
assert.equal(provider.generationEnabled, true);
assert.equal(provider.integrityEnabled, true);
assert.equal(provider.externalProviderRequired, false);
assert.equal(provider.externalProvider.status, 'DISABLED');
assert.equal(provider.externalProvider.generationEnabled, false);
assert.deepEqual(provider.contract, ['analyzeAsset', 'generateCreative', 'validateOutput']);

console.log(JSON.stringify({
  suite: 'creative-core',
  status: 'PASS',
  productDNA: 'PASS',
  immutableIntegrity: 'PASS',
  instructionCompiler: 'PASS',
  outputValidation: 'PASS',
  providerBoundary: 'PASS',
  localProvider: 'PASS',
}));
