import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./lab.mjs', import.meta.url), 'utf8');
assert.match(source, /ARMY-14/);
assert.match(source, /EASY/);
assert.match(source, /MONY/);
assert.match(source, /control-baseline/);
assert.match(source, /promotion.*BLOCKED/);
assert.match(source, /independent verification/i);
console.log('army14-evolution-lab: contract tests passed');
