import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function remember(path, entry) {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, 'utf8');
}

export async function recall(path, predicate = () => true, limit = 20) {
  const body = await readFile(path, 'utf8').catch(() => '');
  return body.split('\n').filter(Boolean).map(line => JSON.parse(line)).filter(predicate).slice(-limit);
}
