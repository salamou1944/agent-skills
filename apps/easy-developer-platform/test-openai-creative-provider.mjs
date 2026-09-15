import assert from 'node:assert/strict';
import http from 'node:http';

const mock = http.createServer(async (req, res) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  assert.equal(req.method, 'POST');
  assert.equal(req.url, '/images/edits');
  assert.match(String(req.headers.authorization), /^Bearer test-key$/);
  assert.match(String(req.headers['content-type']), /^multipart\/form-data;/);
  assert.match(raw, /gpt-image-2/);
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ data: [{ b64_json: 'ZmFrZS1jcmVhdGl2ZS1pbWFnZQ==' }] }));
});
await new Promise(resolve => mock.listen(0, '127.0.0.1', resolve));
const { port } = mock.address();
process.env.EASY_OPENAI_API_KEY = 'test-key';
process.env.EASY_OPENAI_API_BASE = `http://127.0.0.1:${port}`;
process.env.EASY_OPENAI_IMAGE_MODEL = 'gpt-image-2';

const { openAICreativeProvider, openAICreativeProviderStatus } = await import('./openai-creative-provider.mjs');
const provider = openAICreativeProvider();
assert.equal(provider.name, 'openai:gpt-image-2');
assert.equal(openAICreativeProviderStatus().status, 'READY');

const output = await provider.generateCreative({
  immutable: { color: ['black'], brandName: 'EASY TEST' },
  flexible: { background: 'studio' },
}, {
  assetId: 'test-asset',
  asset: { dataUrl: 'data:image/png;base64,aGVsbG8=', mimeType: 'image/png', fileName: 'product.png' },
});
assert.equal(output.provider, 'openai:gpt-image-2');
assert.equal(output.fixture, false);
assert.equal(output.base64, 'ZmFrZS1jcmVhdGl2ZS1pbWFnZQ==');

await new Promise(resolve => mock.close(resolve));
console.log('OPENAI CREATIVE PROVIDER PASS');
