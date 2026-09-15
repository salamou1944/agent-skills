import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRevenueApi } from './revenue-api.mjs';

export async function withRevenueApi(testFn) {
  const app = createRevenueApi({ host: '127.0.0.1', port: 0 });
  const server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try {
    return await testFn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}
