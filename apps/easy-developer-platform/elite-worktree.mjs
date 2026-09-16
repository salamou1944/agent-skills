import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
const exec = promisify(execFile);

async function git(root, args) { return exec('git', args, { cwd: root, timeout: 60_000, maxBuffer: 4_000_000 }); }

export async function withIsolatedWorktree(root, taskId, fn) {
  const base = await git(root, ['rev-parse', '--show-toplevel']);
  const repo = base.stdout.trim();
  const parent = await mkdtemp(join(tmpdir(), 'elite-'));
  const worktree = join(parent, 'worktree');
  let added = false;
  try {
    await git(repo, ['worktree', 'add', '--detach', worktree, 'HEAD']);
    added = true;
    const promote = async (files = []) => {
      for (const file of files) {
        if (typeof file !== 'string' || !file || file.includes('..') || file.startsWith('/') || file.startsWith('.git/')) throw new Error(`unsafe promotion path: ${file}`);
        const source = join(worktree, file), target = join(repo, file);
        const content = await readFile(source, 'utf8');
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, content, 'utf8');
      }
    };
    const result = await fn(worktree, { repo, promote });
    return { ...result, isolated: true };
  } finally {
    if (added) await git(repo, ['worktree', 'remove', '--force', worktree]).catch(() => {});
    await rm(parent, { recursive: true, force: true });
  }
}

export async function workspaceStatus(root) {
  try { const r = await git(root, ['status', '--porcelain=v1']); return { clean: !r.stdout.trim(), status: r.stdout.trim() }; }
  catch (error) { return { clean: false, status: error.message }; }
}
