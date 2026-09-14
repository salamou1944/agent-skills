import assert from 'node:assert/strict';
import { executeGithubChange, GITHUB_OPERATOR_RULES } from './github-operator-executor.mjs';

assert.equal(GITHUB_OPERATOR_RULES.approvalRequired,true);
assert.equal(GITHUB_OPERATOR_RULES.branchIsolated,true);
assert.equal(GITHUB_OPERATOR_RULES.mergeAutomatic,false);

const approval=await executeGithubChange({owner:'salamou1944',repo:'agent-skills',title:'test',changes:[{path:'README.md',content:'x'}],approved:false});
assert.deepEqual(approval,{status:'WAITING_APPROVAL',reason:'explicit_approval_required'});

const blockedPath=await executeGithubChange({owner:'salamou1944',repo:'agent-skills',title:'test',changes:[{path:'.env',content:'x'}],approved:true,token:'test'});
assert.equal(blockedPath.status,'BLOCKED');
assert.equal(blockedPath.reason,'path_not_allowlisted');

const blockedToken=await executeGithubChange({owner:'salamou1944',repo:'agent-skills',title:'test',changes:[{path:'README.md',content:'x'}],approved:true});
assert.deepEqual(blockedToken,{status:'BLOCKED',reason:'github_token_required'});

console.log('GitHub operator executor fail-closed self-test: PASS');
