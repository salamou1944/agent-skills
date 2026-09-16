import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);

export async function analyzePatch(root, { maxFiles = 40, maxChangedLines = 2500 } = {}) {
  try {
    const { stdout } = await exec('git', ['diff', '--numstat'], { cwd: root, timeout: 30_000, maxBuffer: 2_000_000 });
    const rows = stdout.trim() ? stdout.trim().split('\n').map(line => { const [add, del, ...rest] = line.split('\t'); return { additions: Number(add) || 0, deletions: Number(del) || 0, path: rest.join('\t') }; }) : [];
    const changedLines = rows.reduce((n, r) => n + r.additions + r.deletions, 0);
    const findings = [];
    if (rows.length > maxFiles) findings.push({ code: 'too_many_files', count: rows.length });
    if (changedLines > maxChangedLines) findings.push({ code: 'too_large_patch', changedLines });
    if (rows.some(r => r.path.startsWith('.github/workflows/'))) findings.push({ code: 'workflow_patch_requires_gate' });
    return { ok: findings.length === 0, files: rows.length, changedLines, filesChanged: rows.map(r => r.path), findings };
  } catch (error) { return { ok: false, findings: [{ code: 'patch_analysis_failed', message: error.message }] }; }
}
