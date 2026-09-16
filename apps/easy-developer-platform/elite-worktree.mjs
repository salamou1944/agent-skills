import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
      const safeFiles = files.filter(file => typeof file === 'string' && file && !file.includes('..') && !file.startsWith('/') && !file.startsWith('.git/'));
      if (!safeFiles.length) return { promoted: false, reason: 'no_changes' };
      await git(worktree, ['add', '--', ...safeFiles]);
      const commit = await git(worktree, ['commit', '-m', `chore(elite): verified task ${taskId}`]);
      const match = commit.stdout.match(/\[detached HEAD ([0-9a-f]+)\]/i);
      if (!match) throw new Error(`isolated_commit_failed:${commit.stdout || commit.stderr}`);
      try {
        await git(repo, ['cherry-pick', match[1]]);
      } catch (error) {
        await git(repo, ['cherry-pick', '--abort']).catch(() => {});
        throw new Error(`isolated_merge_conflict:${error.stderr || error.message}`);
      }
      return { promoted: true, commit: match[1] };
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
