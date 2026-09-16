import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const exec = promisify(execFile);
const text = (v, max = 12000) => String(v ?? '').slice(0, max);

async function git(root, args) {
  try { const r = await exec('git', args, { cwd: root, timeout: 30_000, maxBuffer: 4_000_000 }); return { ok: true, stdout: text(r.stdout), stderr: text(r.stderr) }; }
  catch (e) { return { ok: false, stdout: text(e.stdout), stderr: text(e.stderr || e.message) }; }
}

export async function inspectRepository({ root, goal, maxContextBytes = 900_000 }) {
  const [status, files, log, branches] = await Promise.all([
    git(root, ['status', '--short']), git(root, ['ls-files']), git(root, ['log', '-12', '--oneline', '--decorate']), git(root, ['branch', '--show-current'])
  ]);
  let packageJson = '';
  try { packageJson = await readFile(join(root, 'package.json'), 'utf8'); } catch {}
  const fileList = files.stdout.split('\n').filter(Boolean);
  const likelyTests = fileList.filter(p => /(^|\/)(test|tests|__tests__)\//.test(p) || /(^|\/)test-[^/]+\.(mjs|js|cjs)$/.test(p)).slice(0, 300);
  const sourceFiles = fileList.filter(p => /\.(mjs|js|cjs|ts|tsx)$/.test(p)).slice(0, 1200);
  const context = JSON.stringify({ goal, branch: branches.stdout.trim(), status: status.stdout, recentCommits: log.stdout, packageJson: text(packageJson, 30_000), fileCount: fileList.length, likelyTests, sourceFiles });
  return { summary: `repository inspected: ${fileList.length} tracked files`, context: context.slice(0, maxContextBytes), facts: { fileCount: fileList.length, testCount: likelyTests.length, sourceCount: sourceFiles.length } };
}

export async function buildTaskContext({ root, changedFiles = [], maxBytes = 120_000 }) {
  const files = [];
  for (const path of changedFiles.slice(0, 40)) {
    try { const content = await readFile(join(root, path), 'utf8'); files.push({ path, content: text(content, 20_000) }); } catch {}
  }
  return JSON.stringify({ changedFiles, files }).slice(0, maxBytes);
}

export async function discoverTests({ root, changedFiles = [] }) {
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8').catch(() => '{}'));
  const scripts = packageJson.scripts || {};
  const candidates = [];
  const names = Object.keys(scripts).filter(name => /(^|:)(test|check|lint|typecheck)(:|$)/.test(name) || /^test/.test(name));
  for (const file of changedFiles) {
    const stem = file.split('/').pop()?.replace(/\.(mjs|js|cjs|ts|tsx)$/, '');
    for (const name of names) if (scripts[name].includes(stem) || name === 'test') candidates.push({ type: 'npm', name, command: scripts[name] });
  }
  for (const name of names) if (name.startsWith('test:elite')) candidates.push({ type: 'npm', name, command: scripts[name] });
  return [...new Map(candidates.map(x => [x.name, x])).values()].slice(0, 12);
}

export async function scanImports(root, files) {
  const graph = {};
  for (const file of files.slice(0, 80)) {
    try { const body = await readFile(join(root, file), 'utf8'); graph[file] = [...body.matchAll(/from\s+['"](\.[^'"]+)['"]|import\s*\(['"](\.[^'"]+)['"]\)/g)].map(m => m[1] || m[2]); } catch {}
  }
  return graph;
}
