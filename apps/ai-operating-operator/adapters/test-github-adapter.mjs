import assert from 'node:assert/strict';
import {runGitHub} from './github-adapter.mjs';
await assert.rejects(()=>runGitHub({repo:'salamou1944/agent-skills',action:'read_repo'},{OPERATOR_GITHUB_REPOS:'salamou1944/agent-skills'}),/github_token_required/);
await assert.rejects(()=>runGitHub({repo:'other/repo',action:'read_repo'},{GITHUB_TOKEN:'x',OPERATOR_GITHUB_REPOS:'salamou1944/agent-skills'}),/allowlisted/);
console.log('github-adapter tests: ok');
