import assert from 'node:assert/strict';
import { GITHUB_PROVIDER_CONTRACT, githubProviderStatus } from './github-provider.mjs';

assert.deepEqual(GITHUB_PROVIDER_CONTRACT,['getBranch','getFile','createBranch','writeFile','openPullRequest']);
const missing=githubProviderStatus({});
assert.equal(missing.configured,false);
assert.equal(missing.verified,false);
assert.equal(missing.reason,'provider_not_configured');
const configured=githubProviderStatus({GITHUB_TOKEN:'test-token'});
assert.equal(configured.configured,true);
assert.equal(configured.verified,false);
assert.equal(configured.reason,'provider_configured_unverified');
console.log('GitHub provider boundary self-test: PASS');
