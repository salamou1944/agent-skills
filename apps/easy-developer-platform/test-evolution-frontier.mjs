import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverGaps } from './evolution-research.mjs';
import { independentlyVerify } from './evolution-independent-verifier.mjs';
import { recordNegativeKnowledge } from './evolution-negative-knowledge.mjs';
import { spawn } from 'node:child_process';

function run(cmd,args,cwd){return new Promise(resolveResult=>{const p=spawn(cmd,args,{cwd,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('close',code=>resolveResult({code,stdout,stderr}));p.on('error',e=>resolveResult({code:null,stdout,stderr:String(e)}))})}
async function git(cwd,...args){const r=await run('git',args,cwd);assert.equal(r.code,0,r.stderr);return r.stdout.trim()}
async function fixture(){const dir=await mkdtemp(join(tmpdir(),'evolution-frontier-test-'));await git(dir,'init');await git(dir,'config','user.email','evolution-test@example.invalid');await git(dir,'config','user.name','Evolution Test');await writeFile(join(dir,'fixture.txt'),'baseline\n');await git(dir,'add','fixture.txt');const baseline=await git(dir,'commit','-m','baseline');return {dir,baseline}}
test('research reports missing frontier layers deterministically',async()=>{const {dir}=await fixture();try{const r=await discoverGaps(dir,'EVOLUTION-LAB','research-test');assert.equal(r.status,'GAPS_DISCOVERED');assert.equal(r.project_id,'EVOLUTION-LAB');assert.ok(r.gaps.some(x=>x.id==='mutation-generation'));assert.ok(r.gaps.some(x=>x.id==='independent-verification'));assert.equal(r.baseline_revision.length,40)}finally{await rm(dir,{recursive:true,force:true})}});
test('negative knowledge appends durable machine-readable rejection',async()=>{const {dir}=await fixture();try{const path=join(dir,'evolution','negative-knowledge.jsonl');const entry=await recordNegativeKnowledge(path,{project_id:'EVOLUTION-LAB',experiment_id:'negative-test',type:'candidate-rejected',reason:'fixture'});assert.equal(entry.type,'candidate-rejected');const rows=(await readFile(path,'utf8')).trim().split('\n').map(JSON.parse);assert.equal(rows.length,1);assert.equal(rows[0].reason,'fixture');assert.equal(rows[0].prev_hash,null);assert.match(rows[0].entry_hash,/^[a-f0-9]{64}$/);const second=await recordNegativeKnowledge(path,{project_id:'EVOLUTION-LAB',experiment_id:'negative-test-2',type:'candidate-rejected',reason:'fixture-2'});assert.equal(second.prev_hash,rows[0].entry_hash)}finally{await rm(dir,{recursive:true,force:true})}});
test('independent verifier replays a recorded survivor with immutable test boundary',async()=>{const {dir}=await fixture();try{
  await writeFile(join(dir,'verify-winner.mjs'),"import { readFileSync } from 'node:fs'; process.exit(readFileSync('fixture.txt','utf8') === 'winner\\n' ? 0 : 1);");
  await git(dir,'add','verify-winner.mjs'); await git(dir,'commit','-m','add verifier fixture');
  const newBaseline=await git(dir,'rev-parse','HEAD');
  const candidate={id:'winner',changes:[{path:'fixture.txt',content:'winner\n'}]};
  const candidate2={id:'loser',changes:[{path:'other.txt',content:'x\n'}]};
  const manifest={run_id:'evolution-test-run-1',baseline_revision:newBaseline,candidates:[candidate,candidate2],tests:[{name:'winner-content',cmd:process.execPath,args:['verify-winner.mjs']}],attacks:[{name:'diff-check',cmd:'git',args:['diff','--check']}],workspace:dir};
  await writeFile(join(dir,'fixture.txt'),'winner\n');
  const d=await run('git',['diff','--binary'],dir); const crypto=await import('node:crypto');
  const diffHash=crypto.createHash('sha256').update(d.stdout).digest('hex');
  const manifestHash=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  const evidence={run_id:manifest.run_id,survivor:'winner',manifest_hash:manifestHash,results:[{id:'winner',diff_hash:diffHash}]};
  const result=await independentlyVerify({workspace:dir,manifest,evidence});
  assert.equal(result.status,'INDEPENDENTLY_VERIFIED'); assert.equal(result.diff_hash,diffHash);
}finally{await rm(dir,{recursive:true,force:true})}});
test('independent verifier rejects malformed evidence and protected mutation paths',async()=>{const {dir,baseline}=await fixture();try{
  const good={id:'winner',changes:[{path:'fixture.txt',content:'winner\n'}]};
  const evidence={run_id:'malformed-run',survivor:'winner',results:[{id:'winner',diff_hash:'a'.repeat(64)}]};
  await assert.rejects(()=>independentlyVerify({workspace:dir,manifest:{run_id:'malformed-run',baseline_revision:baseline,candidates:[good,good],tests:[],attacks:[]},evidence}),/invalid_candidate_identity/);
  await assert.rejects(()=>independentlyVerify({workspace:dir,manifest:{run_id:'malformed-run',baseline_revision:baseline,candidates:[{id:'winner',changes:[{path:'test-owned.mjs',content:'exit(0)'}]}],tests:[],attacks:[]},evidence}),/unsafe_candidate_path/);
  await assert.rejects(()=>independentlyVerify({workspace:dir,manifest:{run_id:'malformed-run',baseline_revision:baseline,candidates:[{id:'winner',changes:[{path:'package.json',content:'{}'}]}],tests:[],attacks:[]},evidence}),/unsafe_candidate_path/);
  await assert.rejects(()=>independentlyVerify({workspace:dir,manifest:{run_id:'malformed-run',baseline_revision:baseline,candidates:[good],tests:[{name:'eval',cmd:process.execPath,args:['-e','process.exit(0)']}],attacks:[]},evidence}),/unsafe_node_invocation/);
  await assert.rejects(()=>independentlyVerify({workspace:dir,manifest:{run_id:'malformed-run',baseline_revision:baseline,candidates:[good],tests:[{name:'shell',cmd:'git',args:['-c','alias.x=!sh -c echo owned','x']}],attacks:[]},evidence}),/unsafe_git_invocation/);
  const outside=join(dir,'outside.txt'); await writeFile(outside,'outside\\n'); await symlink('outside.txt',join(dir,'link.txt')); await git(dir,'add','outside.txt','link.txt'); await git(dir,'commit','-m','add symlink fixture'); const symlinkBaseline=await git(dir,'rev-parse','HEAD');
  await assert.rejects(()=>independentlyVerify({workspace:dir,manifest:{run_id:'symlink-run',baseline_revision:symlinkBaseline,candidates:[{id:'winner',changes:[{path:'link.txt',content:'owned\\n'}]}],tests:[],attacks:[]},evidence:{survivor:'winner',results:[{id:'winner',diff_hash:'a'.repeat(64)}]} }),/candidate_path_symlink/);
}finally{await rm(dir,{recursive:true,force:true})}});

test('independent verifier fails closed on excessive subprocess output', async () => {
  const {dir,baseline}=await fixture();
  try {
    await writeFile(join(dir,'noisy.mjs'),"process.stdout.write('x'.repeat(1_100_000));\n");
    await git(dir,'add','noisy.mjs'); await git(dir,'commit','-m','add noisy verifier fixture');
    const newBaseline=await git(dir,'rev-parse','HEAD');
    const manifest={run_id:'output-limit-run',baseline_revision:newBaseline,candidates:[{id:'winner',changes:[{path:'fixture.txt',content:'winner\\n'}]}],tests:[{name:'noisy',cmd:process.execPath,args:['noisy.mjs']}],attacks:[{name:'diff-check',cmd:'git',args:['diff','--check']}],workspace:dir};
    const crypto=await import('node:crypto');
    const manifestHash=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
    const evidence={run_id:manifest.run_id,survivor:'winner',manifest_hash:manifestHash,results:[{id:'winner',diff_hash:'a'.repeat(64)}]};
    const result=await independentlyVerify({workspace:dir,manifest,evidence});
    assert.equal(result.status,'REJECTED');
    assert.equal(result.tests[0].ok,false);
    assert.equal(result.tests[0].output_limit,true);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('independent verifier rejects replay under a different run identity', async () => {
  const {dir,baseline}=await fixture();
  try {
    const candidate={id:'winner',changes:[{path:'fixture.txt',content:'winner\n'}]};
    const manifest={run_id:'run-a',baseline_revision:baseline,candidates:[candidate],tests:[{name:'diff-check',cmd:'git',args:['diff','--check']}],attacks:[{name:'diff-check',cmd:'git',args:['diff','--check']}],workspace:dir};
    const manifestHash=(await import('node:crypto')).createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
    const replayEvidence={run_id:'run-b',survivor:'winner',manifest_hash:manifestHash,results:[{id:'winner',diff_hash:'a'.repeat(64)}]};
    await assert.rejects(() => independentlyVerify({workspace:dir,manifest,evidence:replayEvidence}), /invalid_evidence/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
