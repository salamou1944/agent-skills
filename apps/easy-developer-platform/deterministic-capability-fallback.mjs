import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const workspace = process.env.EASY_OPERATOR_WORKSPACE || process.cwd();
const goal = String(process.argv.slice(2).join(' ') || '').toLowerCase();

function run(command, args) {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd: workspace, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);
    child.on('error', error => resolve({ code: 1, stdout, stderr: error.message }));
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

async function writeIfMissing(path, content) {
  const absolute = join(workspace, path);
  try { await access(absolute); return false; } catch {}
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, content, 'utf8');
  return true;
}

// This fallback is intentionally a small, allow-listed build catalog. It is not
// a general-purpose code generator: each capability has fixed source, tests and
// verification so provider outages cannot turn into arbitrary unreviewed edits.
const sellerWorkflowSource = `import { assertProductionRecord, createProductionPipeline } from './production-pipeline.mjs';

export function createSellerProductWorkflow({ creativeProvider = null, store }) {
  const runProduction = createProductionPipeline({ creativeProvider, store });
  return async function run(input) {
    const record = await runProduction(input);
    assertProductionRecord(record);
    return {
      version: 1,
      requestId: record.requestId,
      status: 'ready-for-seller-review',
      product: record.dna,
      creative: record.creative,
      integrity: record.integrity,
      provider: record.provider,
      nextAction: 'seller-review'
    };
  };
}

export async function runSellerProductWorkflow(input, options) {
  return createSellerProductWorkflow(options)(input);
}
`;

const sellerWorkflowTest = `import assert from 'node:assert/strict';
import test from 'node:test';
import { createSellerProductWorkflow } from '../src/seller-product-workflow.mjs';

const product = { product_name: 'Sac cuir', product_details: 'Cuir véritable. Fermeture métallique.', selling_points: ['Cuir véritable', 'Fermeture métallique'] };
function memoryStore() { const records = []; return { records, async save(record) { records.push(record); } }; }

test('deterministic seller workflow is review-ready without provider', async () => {
  const store = memoryStore();
  const result = await createSellerProductWorkflow({ store })(product);
  assert.equal(result.status, 'ready-for-seller-review');
  assert.equal(result.integrity.passed, true);
  assert.equal(result.creative.mode, 'deterministic-fallback');
  assert.equal(store.records.length, 1);
});

test('provider output is accepted only after Product Integrity', async () => {
  const store = memoryStore();
  const result = await createSellerProductWorkflow({ store, creativeProvider: { async generate({ dna }) { return { provider: 'fixture', text: dna.name + '. Cuir véritable. Fermeture métallique.' }; } } })(product);
  assert.equal(result.creative.mode, 'provider');
  assert.equal(result.provider, 'fixture');
  assert.equal(result.integrity.passed, true);
});
`;

const matchesSellerCapability = goal.includes('seller/product') || goal.includes('seller product workflow') || goal.includes('seller journey');
if (!matchesSellerCapability) {
  console.log(JSON.stringify({ status: 'NOT_APPLICABLE', reason: 'no allow-listed deterministic capability matches goal' }));
  process.exit(0);
}

const changed = [];
if (await writeIfMissing('src/seller-product-workflow.mjs', sellerWorkflowSource)) changed.push('src/seller-product-workflow.mjs');
if (await writeIfMissing('test/seller-product-workflow.deterministic.test.mjs', sellerWorkflowTest)) changed.push('test/seller-product-workflow.deterministic.test.mjs');

const verification = await run('npm', ['test']);
if (verification.code !== 0) {
  console.error(JSON.stringify({ status: 'FAILED', changed, verification: { code: verification.code, stdout: verification.stdout.slice(-4000), stderr: verification.stderr.slice(-4000) } }));
  process.exit(1);
}

console.log(JSON.stringify({ status: 'VERIFIED', capability: 'easy.seller-product', changed, verification: { command: 'npm test', exitCode: 0, stdout: verification.stdout.slice(-4000) } }));
