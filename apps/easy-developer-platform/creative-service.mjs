import http from 'node:http';
import { createProductDNA, checkProductIntegrity, compileCreativeInstruction, validateCreativeOutput, providerStatus } from './creative-core.mjs';
import { runCreativeJob } from './creative-orchestrator.mjs';
import { openAICreativeProvider } from './openai-creative-provider.mjs';

const port = Number(process.env.EASY_CREATIVE_PORT || 8793);
const send = (res, status, data) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(data));
};
async function body(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 2_000_000) throw Object.assign(new Error('body_too_large'), { status: 413 }); }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('invalid_json'), { status: 400 }); }
}
const selfTestEnabled = () => String(process.env.EASY_CREATIVE_SELF_TEST || '').trim().toLowerCase() === 'true';
const testAsset = (() => {
  // Deterministic, standards-compliant 1024x1024 RGB PNG fixture.
  // The previous inline fixture was malformed and OpenAI correctly rejected it as invalid input.
  const { deflateSync } = await import('node:zlib');
  const width = 1024;
  const height = 1024;
  const row = Buffer.alloc(1 + width * 3, 0);
  row.fill(255, 1);
  const raw = Buffer.alloc((1 + width * 3) * height);
  for (let y = 0; y < height; y += 1) row.copy(raw, y * row.length);
  const crc32 = (buffer) => {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const t = Buffer.from(type);
    const body = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    return Buffer.concat([len, body, crc]);
  };
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const png = Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString('base64')}`;
})();

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && u.pathname === '/api/creative/health') {
      const provider = providerStatus();
      return send(res, 200, {
        ok: true,
        service: 'easy-creative-core',
        version: '0.1.0',
        generationEnabled: provider.generationEnabled,
        integrityEnabled: provider.integrityEnabled,
        provider: provider.provider,
        status: provider.status,
        reason: provider.reason,
        selfTestRequired: Boolean(selfTestEnabled()),
      });
    }
    if (req.method === 'GET' && u.pathname === '/api/creative/self-test') {
      if (!selfTestEnabled()) return send(res, 404, { error: 'not_found' });
      const result = await runCreativeJob({
        mode: 'openai',
        asset: { assetId: 'provider-smoke', mimeType: 'image/png', fileName: 'provider-smoke.png', dataUrl: testAsset, width: 1024, height: 1024 },
        request: { direction: 'Create a minimal realistic commercial presentation. Preserve every immutable product detail exactly; do not invent claims or product features.' },
      }, openAICreativeProvider());
      const summary = {
        jobId: result.jobId,
        status: result.status,
        decision: result.decision,
        reason: result.reason || null,
        errorDetail: result.errorDetail || null,
        stages: result.events?.map(({ stage, decision, reason, error }) => ({ stage, decision, reason: reason || null, error: error || null })) || [],
        integrity: { core: result.validation?.core?.decision || result.validation?.decision || null, provider: result.validation?.provider?.decision || null },
        generatedImage: Boolean(result.output?.dataUrl || result.output?.base64),
      };
      const passed = summary.status === 'SUCCEEDED' && summary.decision === 'PASS' && summary.generatedImage && summary.integrity.core === 'PASS' && summary.integrity.provider === 'PASS';
      console.log('CREATIVE_REAL_SELF_TEST', JSON.stringify({ ...summary, passed }));
      return send(res, passed ? 200 : 503, { ...summary, passed });
    }
    if (req.method === 'GET' && u.pathname === '/api/creative/provider') return send(res, 200, providerStatus());
    if (req.method !== 'POST') return send(res, 404, { error: 'not_found' });
    const input = await body(req);
    if (u.pathname === '/api/creative/product-dna') return send(res, 201, createProductDNA(input));
    if (u.pathname === '/api/creative/integrity') return send(res, 200, checkProductIntegrity(input.dna, input.candidate));
    if (u.pathname === '/api/creative/compile') return send(res, 200, compileCreativeInstruction(input.dna, input.request));
    if (u.pathname === '/api/creative/validate-output') return send(res, 200, validateCreativeOutput(input.dna, input.output));
    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    return send(res, error.status || 400, { error: error.message || 'request_failed' });
  }
}).listen(port, '127.0.0.1', () => console.log(`EASY Creative Core listening on ${port}`));
