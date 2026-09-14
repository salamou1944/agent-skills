import http from 'node:http';
import { createProductDNA, checkProductIntegrity, compileCreativeInstruction, validateCreativeOutput, providerStatus } from './creative-core.mjs';

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

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && u.pathname === '/api/creative/health') return send(res, 200, { ok: true, service: 'easy-creative-core', version: '0.1.0', generationEnabled: false });
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
