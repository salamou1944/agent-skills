import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(root, 'public');

test('human-facing customer and creative entrypoints exist and are fail-closed', async () => {
  const customer = await readFile(join(publicDir, 'customer.html'), 'utf8');
  const creative = await readFile(join(publicDir, 'creative.html'), 'utf8');
  const gateway = await readFile(join(root, 'gateway.mjs'), 'utf8');

  assert.match(customer, /api\/customer\/(register|login)/);
  assert.match(customer, /easy_access_token/);
  assert.match(creative, /api\/creative\/product-dna/);
  assert.match(creative, /api\/creative-job\/run/);
  assert.match(creative, /mode:'local'/);
  assert.match(creative, /sourceAssetSha256/);
  assert.match(creative, /BLOCK — لم يتم تقديم نجاح وهمي/);
  assert.match(gateway, /publicFile\('customer\.html'\)/);
  assert.match(gateway, /publicFile\('creative\.html'\)/);
});
