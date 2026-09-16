import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export function createMetrics() {
  const started = Date.now();
  const metrics = { startedAt: new Date(started).toISOString(), steps: 0, repairs: 0, tests: 0, providers: {}, failures: 0, status: null, durationMs: null };
  return { metrics, step() { metrics.steps += 1; }, repair() { metrics.repairs += 1; }, test() { metrics.tests += 1; }, provider(name) { metrics.providers[name] = (metrics.providers[name] || 0) + 1; }, fail() { metrics.failures += 1; }, finish(status) { metrics.status = status; metrics.durationMs = Date.now() - started; return metrics; } };
}

export async function persistMetric(path, metric) {
  if (!path) return;
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(metric)}\n`, 'utf8');
}

export async function readMetrics(path) {
  const body = await readFile(path, 'utf8').catch(() => '');
  return body.split('\n').filter(Boolean).map(line => JSON.parse(line));
}
