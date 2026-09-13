import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const COMMANDS = Object.freeze({
  syntax: { command: process.execPath, args: file => ['--check', file] },
  tests: { command: process.execPath, args: file => [file] }
});
const EXT = /\.(mjs|js|cjs)$/i;
const MAX_FILES = 500;

async function walk(dir, base=dir, out=[]) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, base, out);
    else out.push(relative(base, path));
    if (out.length >= MAX_FILES) break;
  }
  return out;
}

function run(spec, cwd, timeout=15000) {
  return new Promise(resolveResult => {
    const child = spawn(spec.command, spec.args, { cwd, shell: false, stdio: ['ignore','pipe','pipe'] });
    let stdout='', stderr='', settled=false;
    const finish = value => { if (settled) return; settled=true; clearTimeout(timer); resolveResult(value); };
    const timer=setTimeout(() => { child.kill('SIGKILL'); finish({ok:false,error:'timeout',stdout,stderr}); }, timeout);
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);
    child.on('error', e => finish({ok:false,error:e.message,stdout,stderr}));
    child.on('close', (code, signal) => finish({ok:code===0,code,signal,stdout,stderr}));
  });
}

export async function inspectWorkspace(workspace='.') {
  const root=resolve(workspace);
  const files=await walk(root);
  return { tool:'inspect_workspace', ok:true, workspace:root, fileCount:files.length, files };
}

export async function guardianScan(workspace='.') {
  const root=resolve(workspace), files=await walk(root), sensitive=[];
  for (const file of files) {
    if (!EXT.test(file)) continue;
    const content=await readFile(join(root,file),'utf8');
    if (/(?:api[_-]?key|password|secret|private[_-]?key|token)\s*[:=]/i.test(content)) sensitive.push(file);
  }
  return { tool:'guardian_scan', ok:sensitive.length===0, sensitiveFiles:sensitive };
}

export async function verifySyntax(workspace='.') {
  const root=resolve(workspace), files=(await walk(root)).filter(file => EXT.test(file)).slice(0,100), failures=[];
  for (const file of files) {
    const result=await run(COMMANDS.syntax.args(join(root,file)), root);
    if (!result.ok) failures.push({path:file,error:result.error,stderr:result.stderr.slice(0,1000)});
  }
  return { tool:'syntax_verification', ok:failures.length===0, checked:files.length, failures };
}

export async function runNamedTool(name, args={}) {
  const root=resolve(args.workspace||'.');
  if (name==='inspect_workspace') return inspectWorkspace(root);
  if (name==='guardian_scan') return guardianScan(root);
  if (name==='syntax_verification') return verifySyntax(root);
  if (name==='run_test') {
    const test=args.test;
    if (!test || !EXT.test(test)) throw new Error('invalid_test_path');
    const target=resolve(root,test);
    if (!(target===root||target.startsWith(root+'/' ))) throw new Error('invalid_test_path');
    const result=await run(COMMANDS.tests.args(target), root, args.timeout||30000);
    return {tool:'run_test',ok:result.ok,test:relative(root,target),error:result.error,stdout:result.stdout.slice(0,4000),stderr:result.stderr.slice(0,4000)};
  }
  throw new Error('tool_not_allowed');
}

export const TOOL_REGISTRY = Object.freeze(['inspect_workspace','guardian_scan','syntax_verification','run_test']);
