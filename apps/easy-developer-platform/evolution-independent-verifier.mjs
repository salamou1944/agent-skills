import { mkdtemp, readFile, rm, writeFile, mkdir, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile as readTextFile } from 'node:fs/promises';
import { evaluateHeldOutEvidence } from './heldout-evaluator.mjs';

const ALLOWED=/^(?!\.git)(?!\.github\/workflows\/)(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/;
const FORBIDDEN=/(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|secrets?(?:\/|\.)|credentials?(?:\/\.))/i;
const PROTECTED=/(^|\/)(?:package(?:-lock)?\.json|yarn\.lock|pnpm-lock\.yaml|heldout-evaluator\.mjs|evolution-independent-verifier\.mjs|test-[A-Za-z0-9_.-]+\.mjs)$/i;
const HEX64=/^[a-f0-9]{64}$/;
function run(cmd,args,cwd,timeout=120000){return new Promise(res=>{const p=spawn(cmd,args,{cwd,stdio:['ignore','pipe','pipe']});let o='',e='',settled=false;const finish=r=>{if(settled)return;settled=true;clearTimeout(t);res(r)};const t=setTimeout(()=>{p.kill('SIGKILL');finish({ok:false,code:null,timeout:true,stdout:o,stderr:e})},timeout);p.stdout.on('data',d=>o+=d);p.stderr.on('data',d=>e+=d);p.on('close',c=>finish({ok:c===0,code:c,stdout:o,stderr:e}));p.on('error',x=>finish({ok:false,error:x.message,stdout:o,stderr:e}))})}
function hash(x){return createHash('sha256').update(JSON.stringify(x)).digest('hex')}
async function moduleHash(){return createHash('sha256').update(await readTextFile(new URL(import.meta.url))).digest('hex')}
function validatePath(path){if(typeof path!=='string'||path.startsWith('/')||path.includes('..')||!ALLOWED.test(path)||FORBIDDEN.test(path)||PROTECTED.test(path))throw new Error('unsafe_candidate_path')}
function validate(change){if(!change||typeof change!=='object')throw new Error('invalid_candidate_change');validatePath(change.path);if(typeof change.content!=='string')throw new Error('invalid_candidate_content')}
function validateManifest(manifest,evidence){
  if(!manifest||typeof manifest!=='object'||!Array.isArray(manifest.candidates)||!manifest.candidates.length)throw new Error('invalid_manifest');
  if(typeof manifest.baseline_revision!=='string'||!/^[a-f0-9]{40}$/.test(manifest.baseline_revision))throw new Error('invalid_baseline_revision');
  const ids=new Set();
  for(const c of manifest.candidates){if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id))throw new Error('invalid_candidate_identity');ids.add(c.id);if(!Array.isArray(c.changes)||!c.changes.length)throw new Error('invalid_candidate_changes');const paths=new Set();for(const change of c.changes){validate(change);if(paths.has(change.path))throw new Error('duplicate_candidate_path:'+change.path);paths.add(change.path)}}
  if(!evidence||typeof evidence.survivor!=='string'||!Array.isArray(evidence.results)||typeof evidence.manifest_hash!=='string'||!HEX64.test(evidence.manifest_hash))throw new Error('invalid_evidence');
  const resultIds=new Set();
  for(const result of evidence.results){if(!result||typeof result.id!=='string'||resultIds.has(result.id))throw new Error('invalid_evidence_result_identity');resultIds.add(result.id);}
  const matching=evidence.results.filter(x=>x.id===evidence.survivor);
  if(matching.length!==1||!HEX64.test(String(matching[0]?.diff_hash||'')))throw new Error('invalid_recorded_diff_hash');
}
function validateCheckCommand(t){
  if(!t||typeof t!=='object'||typeof t.name!=='string'||!t.name)throw new Error('invalid_test_definition');
  if(typeof t.cmd!=='string'||!['git',process.execPath,'node'].includes(t.cmd))throw new Error('untrusted_test_command');
  if(t.args!==undefined&&!Array.isArray(t.args))throw new Error('invalid_test_args');
  if((t.args||[]).some(arg=>typeof arg!=='string'))throw new Error('invalid_test_arg');
  const args=t.args||[];
  if(t.cmd==='git'){
    const safe=JSON.stringify(args)===JSON.stringify(['diff','--check'])||JSON.stringify(args)===JSON.stringify(['diff','--name-only'])||JSON.stringify(args)===JSON.stringify(['diff','--binary'])||JSON.stringify(args)===JSON.stringify(['rev-parse','HEAD']);
    if(!safe)throw new Error('unsafe_git_invocation');
  } else if(args.length!==1||args[0].startsWith('-')||args[0].includes('..')||args[0].startsWith('/')||FORBIDDEN.test(args[0])||PROTECTED.test(args[0])||!ALLOWED.test(args[0]))throw new Error('unsafe_node_invocation');
  if(t.timeout!==undefined&&(!Number.isInteger(t.timeout)||t.timeout<1||t.timeout>120000))throw new Error('invalid_test_timeout')
}
async function assertNoSymlinkPath(dir,relativePath){const parts=relativePath.split('/');let current=dir;for(const part of parts){current=join(current,part);try{const stat=await lstat(current);if(stat.isSymbolicLink())throw new Error('candidate_path_symlink');}catch(error){if(error.code==='ENOENT')break;throw error;}}}
async function apply(dir,candidate){for(const c of candidate.changes){validate(c);await assertNoSymlinkPath(dir,c.path);const target=join(dir,c.path);await mkdir(resolve(target,'..'),{recursive:true});await assertNoSymlinkPath(dir,c.path);await writeFile(target,c.content,'utf8')}}
async function checks(dir,tests=[]){const results=[];for(const t of tests){validateCheckCommand(t);const r=await run(t.cmd,t.args||[],dir,t.timeout||120000);results.push({name:t.name,ok:r.ok,code:r.code,timeout:r.timeout===true,stdout:r.stdout.slice(-3000),stderr:r.stderr.slice(-3000)});if(!r.ok)break}return results}
export async function independentlyVerify({workspace,manifest,evidence}){
  validateManifest(manifest,evidence);
  if(evidence.manifest_hash!==hash(manifest))throw new Error('manifest_evidence_mismatch');
  const root=resolve(workspace), temp=await mkdtemp(join(tmpdir(),'evolution-independent-'));
  try{
    const clone=await run('git',['clone','--no-hardlinks',root,temp],process.cwd(),120000);
    if(!clone.ok)throw new Error('independent_clone_failed');
    const actual=(await run('git',['rev-parse','HEAD'],temp)).stdout.trim();
    if(actual!==manifest.baseline_revision)throw new Error('baseline_revision_mismatch');
    const survivor=manifest.candidates.find(c=>c.id===evidence.survivor);
    if(!survivor)throw new Error('survivor_missing_from_manifest');
    await apply(temp,survivor);
    const tests=await checks(temp,manifest.tests||[{name:'diff-check',cmd:'git',args:['diff','--check']}]);
    const attacks=await checks(temp,manifest.attacks||[{name:'diff-check',cmd:'git',args:['diff','--check']}]);
    const changedFiles=(await run('git',['diff','--name-only'],temp)).stdout.split('\n').filter(Boolean);
    if(changedFiles.some(x=>x.startsWith('.github/workflows/')))throw new Error('protected_workflow_boundary');
    if(changedFiles.some(x=>FORBIDDEN.test(x)||PROTECTED.test(x)))throw new Error('protected_verifier_boundary');
    const diff=(await run('git',['diff','--binary'],temp)).stdout;
    const diffHash=createHash('sha256').update(diff).digest('hex');
    const recorded=evidence.results.find(x=>x.id===evidence.survivor)?.diff_hash;
    const passed=tests.length>0&&attacks.length>0&&tests.every(x=>x.ok)&&attacks.every(x=>x.ok)&&diffHash===recorded;
    const heldout=evaluateHeldOutEvidence({workspace:temp,evidence:{baseline_revision:actual,candidate_id:evidence.survivor,candidate_diff_hash:diffHash,deterministic_tests_passed:tests.every(x=>x.ok),adversarial_checks_passed:attacks.every(x=>x.ok),independent_replay_passed:passed}});
    const independentEvidence={status:passed&&heldout.status==='HELDOUT_VERIFIED'?'INDEPENDENTLY_VERIFIED':'REJECTED',survivor:evidence.survivor,baseline_revision:actual,diff_hash:diffHash,recorded_diff_hash:recorded,verifier_module_sha256:await moduleHash(),heldout,tests,attacks};
    independentEvidence.evidence_hash=hash(independentEvidence);
    return independentEvidence;
  }finally{await rm(temp,{recursive:true,force:true})}
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const manifestPath=process.argv[2],evidencePath=process.argv[3],outputPath=process.argv[4];
  if(!manifestPath||!evidencePath||!outputPath)throw new Error('usage: evolution-independent-verifier.mjs <manifest> <evidence> <output>');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8')),evidence=JSON.parse(await readFile(evidencePath,'utf8'));
  const result=await independentlyVerify({workspace:manifest.workspace||'.',manifest,evidence});
  await writeFile(outputPath,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
