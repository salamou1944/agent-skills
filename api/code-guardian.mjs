import http from 'node:http';
import { scanFiles } from '../tools/code-guardian.mjs';

export function createCodeGuardianApi({ host = '127.0.0.1', port = 8787, maxBodyBytes = 2_000_000 } = {}) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.method !== 'POST' || req.url !== '/v1/guard') {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: 'not_found' }));
    }
    let size = 0; const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= maxBodyBytes) chunks.push(chunk);
      else req.destroy();
    });
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!Array.isArray(body.files) || body.files.length === 0 || body.files.length > 200) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'files must contain 1..200 items' }));
        }
        const result = scanFiles(body.files);
        res.statusCode = result.status === 'guarded' ? 200 : 422;
        res.end(JSON.stringify(result));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'invalid_json_or_payload' }));
      }
    });
  });
  return { host, port, server, listen() { return server.listen(port, host); }, close() { return server.close(); } };
}
