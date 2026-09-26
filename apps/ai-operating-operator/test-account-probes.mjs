import assert from 'node:assert/strict';
import {probeAccounts} from './account-probes.mjs';
const r=await probeAccounts({});
assert.equal(r.github.configured,false);
assert.equal(r.railway.configured,false);
assert.equal(r.vercel.configured,false);
assert.equal(r.supabase.configured,false);
console.log('account-probes tests: ok');
