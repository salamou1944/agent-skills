import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const MAX_INPUT_BYTES = Number(process.env.EASY_LOCAL_MEDIA_MAX_INPUT_BYTES || 8_000_000);
const TIMEOUT_MS = Number(process.env.EASY_LOCAL_MEDIA_TIMEOUT_MS || 120_000);
const PYTHON = process.env.EASY_REMBG_PYTHON || 'python3';

function parseDataUrl(value) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(value || ''));
  if (!match) throw Object.assign(new Error('invalid_data_url'), { code: 'LOCAL_MEDIA_INVALID_INPUT' });
  const bytes = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  if (!bytes.length || bytes.length > MAX_INPUT_BYTES) throw Object.assign(new Error('input_size_invalid'), { code: 'LOCAL_MEDIA_INPUT_TOO_LARGE' });
  return { mimeType: match[1].toLowerCase(), bytes };
}

export async function runLocalMedia({ operation = 'background_removal', dataUrl } = {}) {
  if (operation !== 'background_removal') return { status: 'LOCAL_CAPABILITY_UNAVAILABLE', code: 'LOCAL_CAPABILITY_UNAVAILABLE', operation, reason: 'unsupported_local_operation' };
  let parsed;
  try { parsed = parseDataUrl(dataUrl); } catch (error) { return { status: 'LOCAL_CAPABILITY_FAILED', code: error.code || 'LOCAL_MEDIA_INVALID_INPUT', operation, reason: error.message }; }
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'easy-local-media-'));
  const ext = parsed.mimeType === 'image/jpeg' ? 'jpg' : parsed.mimeType === 'image/webp' ? 'webp' : 'png';
  const input = path.join(workspace, 'input.' + ext);
  const output = path.join(workspace, 'output.png');
  const startedAt = new Date().toISOString();
  try {
    await fs.writeFile(input, parsed.bytes);
    const result = await execFileAsync(PYTHON, ['-m', 'rembg', 'i', input, output], { timeout: TIMEOUT_MS, maxBuffer: 512_000, env: { ...process.env, PYTHONUNBUFFERED: '1' } });
    const stat = await fs.stat(output);
    if (!stat.isFile() || stat.size <= 0) throw new Error('local_artifact_missing');
    const artifact = await fs.readFile(output);
    return {
      status: 'LOCAL_CAPABILITY_EXECUTED', code: 'LOCAL_CAPABILITY_EXECUTED', operation,
      dataUrl: 'data:image/png;base64,' + artifact.toString('base64'),
      evidence: { runner: PYTHON + ' -m rembg', verifiedFile: true, artifactBytes: stat.size, startedAt, completedAt: new Date().toISOString(), stdout: String(result.stdout || '').slice(-1000), stderr: String(result.stderr || '').slice(-1000) },
    };
  } catch (error) {
    return { status: 'LOCAL_CAPABILITY_FAILED', code: 'LOCAL_CAPABILITY_FAILED', operation, reason: String(error?.message || 'local_execution_failed').slice(0, 500), evidence: { runner: PYTHON + ' -m rembg', verifiedFile: false, startedAt, completedAt: new Date().toISOString() } };
  } finally { await fs.rm(workspace, { recursive: true, force: true }).catch(() => {}); }
}