import fs from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.PORT || 8080);
const baseUrl = `http://127.0.0.1:${port}`;
const stateDir = process.env.EASY_STATE_DIR || '/app/data/easy';
const statePath = path.join(stateDir, 'background-cycle.json');

async function probe(route) {
  try {
    const response = await fetch(`${baseUrl}${route}`, { signal: AbortSignal.timeout(8_000) });
    const text = await response.text();
    return { route, ok: response.ok, status: response.status, body: text.slice(0, 500) };
  } catch (error) {
    return { route, ok: false, status: 0, error: error.message };
  }
}

const checks = await Promise.all([
  probe('/api/gateway/status'),
  probe('/api/customer/health'),
]);
const result = {
  service: 'easy-background-cycle',
  checkedAt: new Date().toISOString(),
  ok: checks.every((item) => item.ok),
  checks,
};

await fs.mkdir(stateDir, { recursive: true });
const tempPath = `${statePath}.tmp`;
await fs.writeFile(tempPath, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
await fs.rename(tempPath, statePath);
console.log(JSON.stringify(result));
if (!result.ok) process.exitCode = 1;
