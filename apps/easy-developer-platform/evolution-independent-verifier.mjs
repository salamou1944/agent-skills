import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile as readTextFile } from 'node:fs/promises';

const ALLOWED=/^(?!\.git)(?!\.github\/workflows\/)(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/;
const FORBIDDEN=/(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|secrets?(?:\/|\.)|credentials?(?:\/\.))/i;
function run(cmd,args,cwd,timeout=120000){return new Promise(res=>{const p=spawn(cmd,args,{cwd,stdio:['ignore','pipe','pipe']});let o='',e='';const t=setTimeout(()=>{p.kill('SIGKILL');res({ok:false,code:null,timeout:true,stdout:o,stderr:e})},timeout);p.stdout.on('data',d=>o+=d);p.stderr.on('data',d=>e+=d);p.on('close',c=>{clearTimeout(t);res({ok:c===0,code:c,stdout:o,stderr:e})});p.on('error',x=>{clearTimeout(t);res({ok:false,error:x.message,stdout:o,stderr:e})})})}
function hash(x){return createHash('sha256').update(JSON.stringify(x)).digest('hex')}
async function moduleHash(){return createHash('sha256').update(await readTextFile(new URL(import.meta.url))).digest('hex')}
function validate(change){if(!change||typeof change.path!=='string'||change.path.startsWith('/')||change.path.includes('..')||!ALLOWED.test(change.path)||FORBIDDEN.test(change.path))throw new Error('unsafe_candidate_path');if(typeof change.content!=='string')throw new Error('invalid_candidate_content')}
async function apply(dir,candidate){for(const c of candidate.changes){validate(c);const target=join(dir,c.path);await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,c.content,'utf8')}}
async function checks(dir,tests=[]){const results=[];for(const t of tests){const r=await run(t.cmd,t.args||[],dir,t.timeout||120000);results.push({name:t.name,ok:r.ok,code:r.code,stdout:r.stdout.slice(-3000),stderr:r.stderr.slice(-3000)});if(!r.ok)break}return results}
export async function independentlyVerify({workspace,manifest,evidence}){
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
    const changedFiles=(await run('git',['diff','--name-only'],temp)).stdout.split('\n').filter(Boolean);\n    if(changedFiles.some(x=>x.startsWith('.github/workflows/')))throw new Error('protected_workflow_boundary');\n    if(changedFiles.some(x=>FORBIDDEN.test(x)))throw new Error('forbidden_credential_path');\n    const diff=(await run('git',['diff','--binary'],temp)).stdout;
    const diffHash=createHash('sha256').update(diff).digest('hex');
    const recorded=evidence.results?.find(x=>x.id===evidence.survivor)?.diff_hash;
    const passed=tests.every(x=>x.ok)&&attacks.every(x=>x.ok)&&diffHash===recorded;
    const independentEvidence={status:passed?'INDEPENDENTLY_VERIFIED':'REJECTED',survivor:evidence.survivor,baseline_revision:actual,diff_hash:diffHash,recorded_diff_hash:recorded,verifier_module_sha256:await moduleHash(),tests,attacks};
    independentEvidence.evidence_hash=hash(independentEvidence);
    return independentEvidence;
  }finally{await rm(temp,{recursive:true,force:true})}
}

if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const manifestPath=process.argv[2], evidencePath=process.argv[3], outputPath=process.argv[4];
  if(!manifestPath||!evidencePath||!outputPath)throw new Error('usage: evolution-independent-verifier.mjs <manifest> <evidence> <output>');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8')), evidence=JSON.parse(await readFile(evidencePath,'utf8'));
  const result=await independentlyVerify({workspace:manifest.workspace||'.',manifest,evidence});
  await writeFile(outputPath,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}
