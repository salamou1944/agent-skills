import assert from 'node:assert/strict';
import http from 'node:http';

process.env.EASY_OPENAI_API_KEY = 'test-key';
process.env.EASY_OPENAI_IMAGE_MODEL = 'gpt-image-2';
process.env.EASY_OPENAI_VISION_MODEL = 'gpt-5.6-luna';

const originalFetch = globalThis.fetch;
const fakePng = Buffer.from('89504e470d0a1a0a', 'hex').toString('base64');
const observations = {
  category: 'cosmetics', type: 'bottle', description: 'small cosmetic bottle', brandName: 'EASY', printedText: ['EASY'],
  logo: 'EASY wordmark', color: ['white'], shape: 'cylindrical bottle', components: ['cap', 'bottle'],
  designDetails: ['white label'], material: ['plastic'], background: 'plain', environment: 'studio',
  lighting: 'soft', camera: 'front', composition: 'centered', objects: [], effects: [], context: 'product photo',
};

const responseBody = payload => JSON.stringify({ output_text: JSON.stringify(payload), output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(payload) }] }] });

globalThis.fetch = async (url, init = {}) => {
  const target = String(url);
  if (target.endsWith('/responses')) {
    const body = JSON.parse(init.body);
    assert.equal(body.model, 'gpt-5.6-luna');
    assert.equal(body.store, false);
    assert.equal(body.text.format.type, 'json_schema');
    assert.equal(body.input[0].content[1].type, 'input_image');
    return new Response(responseBody(observations), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (target.endsWith('/images/edits')) {
    assert.equal(init.method, 'POST');
    assert.match(init.headers.authorization, /^Bearer test-key$/);
    assert.ok(init.body instanceof FormData);
    assert.equal(init.body.get('model'), 'gpt-image-2');
    assert.ok(init.body.get('image'));
    return new Response(JSON.stringify({ data: [{ b64_json: fakePng, revised_prompt: 'verified test prompt' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  throw new Error(`unexpected_url:${target}`);
};

const { openAICreativeProvider, openAICreativeProviderStatus } = await import('./openai-creative-provider.mjs');
const { runCreativeJob } = await import('./creative-orchestrator.mjs');

assert.equal(openAICreativeProviderStatus().generationEnabled, true);
assert.equal(openAICreativeProviderStatus().integrityEnabled, true);

const provider = openAICreativeProvider();
const result = await runCreativeJob({
  assetId: 'test-asset',
  asset: { dataUrl: `data:image/png;base64,${fakePng}`, mimeType: 'image/png', fileName: 'product.png' },
  request: { direction: 'premium studio creative', background: 'neutral studio' },
}, provider);

assert.equal(result.status, 'SUCCEEDED');
assert.equal(result.decision, 'PASS');
assert.equal(result.events.find(e => e.stage === 'product-dna').decision, 'PASS');
assert.equal(result.events.find(e => e.stage === 'generation').decision, 'PASS');
assert.equal(result.events.find(e => e.stage === 'integrity-vision').decision, 'PASS');
assert.equal(result.output.provider, 'openai:gpt-image-2');
assert.ok(result.output.dataUrl.startsWith('data:image/png;base64,'));

const blocked = await runCreativeJob({
  assetId: 'test-asset',
  asset: { dataUrl: `data:image/png;base64,${fakePng}`, mimeType: 'image/png', fileName: 'product.png' },
  request: { direction: 'premium studio creative' },
}, {
  name: 'blocked-provider',
  async analyzeAsset() { return { observations }; },
  async generateCreative(instruction) { return { immutable: instruction.immutable, claims: [], dataUrl: `data:image/png;base64,${fakePng}` }; },
  async validateOutput() { return { decision: 'BLOCK', mismatches: [{ field: 'color' }], reason: 'vision-detected-immutable-change' }; },
});
assert.equal(blocked.status, 'BLOCKED');
assert.equal(blocked.decision, 'BLOCK');
assert.equal(blocked.reason, 'vision-detected-immutable-change');

globalThis.fetch = originalFetch;
console.log('openai creative provider tests passed');
