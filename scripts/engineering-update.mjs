#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const rootArg = args.find((a) => a.startsWith('--root='))?.slice(7) ?? '.';
const outputArg = args.find((a) => a.startsWith('--output='))?.slice(9) ?? '.engineering-update';
const root = path.resolve(rootArg);
const output = path.resolve(root, outputArg);

const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => { try { return fs.readFileSync(path.join(root, p), 'utf8'); } catch { return null; } };
function walk(dir, limit = 4000, out = []) {
  if (out.length >= limit || !fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git','node_modules','dist','build','.next','.turbo'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, limit, out);
    else out.push(path.relative(root, p).replaceAll(path.sep, '/'));
    if (out.length >= limit) break;
  }
  return out;
}
function git(args) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim(); }
  catch { return null; }
}
function write(name, value) { fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + '\n'); }

const files = walk(root);
const manifests = ['package.json','pnpm-lock.yaml','yarn.lock','package-lock.json','requirements.txt','pyproject.toml','go.mod','Cargo.toml','composer.json'].filter(exists);
const testFiles = files.filter((f) => /(^|\/)(__tests__|tests?|specs?)(\/|$)|\.(test|spec)\.[^/]+$/i.test(f));
const ciFiles = files.filter((f) => /(^|\/)(\.github\/workflows|\.gitlab-ci|Jenkinsfile|circleci)/i.test(f));
const sourceFiles = files.filter((f) => /\.(js|mjs|cjs|ts|tsx|jsx|py|go|rs|java|kt|rb|php|cs|swift)$/i.test(f));
const packageJson = read('package.json');
let packageData = null;
try { packageData = packageJson ? JSON.parse(packageJson) : null; } catch {}

const snapshot = {
  schemaVersion: '1.0', type: 'repository-snapshot', generatedAt: new Date().toISOString(),
  repository: { root, git: { isRepository: Boolean(git(['rev-parse','--is-inside-work-tree'])), branch: git(['branch','--show-current']), commit: git(['rev-parse','HEAD']) } },
  structure: { fileCount: files.length, files, sourceFileCount: sourceFiles.length, testFileCount: testFiles.length, testFiles, ciFiles, manifests },
  runtime: { packageManager: packageData?.packageManager ?? (exists('pnpm-lock.yaml') ? 'pnpm' : exists('yarn.lock') ? 'yarn' : exists('package-lock.json') ? 'npm' : null), node: packageData?.engines?.node ?? null, scripts: packageData?.scripts ?? {} },
  interfaces: { entrypoints: ['index.js','index.ts','src/index.js','src/index.ts','app.js','server.js','src/main.ts'].filter(exists) },
  boundaries: { generated: ['dist','build','.next','.turbo'].filter(exists), ignored: ['.git','node_modules'].filter(exists) }
};
write('repository-snapshot.json', snapshot);

const changePlan = {
  schemaVersion: '1.0', type: 'change-plan', status: 'draft', generatedAt: new Date().toISOString(),
  objective: 'Describe and verify a repository update before promotion.',
  scope: { repository: root, affectedFiles: [], exclusions: ['.git','node_modules','dist','build'] },
  acceptanceCriteria: ['Requested behavior is implemented.', 'Existing relevant tests remain green.', 'New behavior has executable verification.', 'Security and compatibility checks pass.', 'Evidence is captured before promotion.'],
  risk: { level: 'unknown', assumptions: ['No requested change was supplied to the runner.'] },
  rollback: { required: true, strategy: 'Revert the update commit or restore the recorded baseline.' }
};
write('change-plan.json', changePlan);

const execution = { schemaVersion: '1.0', type: 'execution-record', status: 'snapshot-only', generatedAt: new Date().toISOString(), commands: [], evidence: [], environment: { cwd: root, node: process.version, platform: process.platform } };
write('execution-record.json', execution);

const verification = {
  schemaVersion: '1.0', type: 'verification-result', generatedAt: new Date().toISOString(), verdict: 'NOT_READY', blockingFindings: [
    { id: 'NO_CHANGE_REQUEST', severity: 'HIGH', message: 'No concrete change plan was supplied; implementation and behavioral verification cannot be claimed.' },
    ...(testFiles.length === 0 ? [{ id: 'NO_TEST_SURFACE', severity: 'HIGH', message: 'No recognizable test files were discovered.' }] : []),
  ], checks: { repositorySnapshot: 'PASS', changeImplementation: 'NOT_RUN', tests: 'NOT_RUN', regression: 'NOT_RUN', security: 'NOT_RUN', ci: 'NOT_RUN' }
};
write('verification-result.json', verification);

const manifest = {
  schemaVersion: '1.0', type: 'update-manifest', generatedAt: new Date().toISOString(), status: 'NOT_READY', baselineCommit: snapshot.repository.git.commit,
  objective: changePlan.objective, changedFiles: [], verification: verification.verdict, residualRisks: verification.blockingFindings.map((f) => ({ id: f.id, severity: f.severity, message: f.message })), reviewerAction: 'Provide a concrete change request, execute the implementation loop, and attach test/CI evidence before promotion.'
};
write('update-manifest.json', manifest);

console.log(JSON.stringify({ output, snapshot: snapshot.structure, verification: verification.verdict, blockingFindings: verification.blockingFindings }, null, 2));
process.exitCode = verification.verdict === 'NOT_READY' ? 2 : 0;
