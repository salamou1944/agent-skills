import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

export function createEliteRuntime({ runTask, port = Number(process.env.PORT || 8787) }) {
  let active = 0;
  const startedAt = Date.now();
  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, service: 'elite-runtime', active, uptimeMs: Date.now() - startedAt })); return; }
    if (req.method !== 'POST' || req.url !== '/tasks') { res.writeHead(404); res.end('not_found'); return; }
    let body = ''; req.setEncoding('utf8'); req.on('data', chunk => { body += chunk; if (body.length > 100_000) req.destroy(); });
    req.on('end', async () => {
      try { const input = JSON.parse(body || '{}'); if (!String(input.goal || '').trim()) throw new Error('goal_required'); active += 1; const result = await runTask(input.goal, input.options || {}); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(result)); }
      catch (error) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ status: 'FAILED', code: error.code || 'runtime_error', error: error.message })); }
      finally { active -= 1; }
    });
  });
  return { server, start: () => new Promise(resolve => server.listen(port, resolve)), stop: () => new Promise(resolve => server.close(resolve)) };
}
