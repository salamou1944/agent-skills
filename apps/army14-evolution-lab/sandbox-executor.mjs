import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const MAX_FILES=12;
const MAX_FILE_BYTES=200000;
const ALLOWED_PATH=/\.(mjs|js|cjs|json|md|yml|yaml|ts|tsx)$/i;
const FORBIDDEN_PATH=/(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|secrets?(?:\/|\.)|credentials?(?:\/\.))/i;

export const SANDBOX_POLICY=Object.freeze({
  maxFiles:MAX_FILES,maxFileBytes:MAX_FILE_BYTES,network:'deny-by-policy',
  workflows:'deny',secrets:'deny',evaluatorMutation:'deny',cleanup:'required',
});

function validateChanges(changes,evaluatorFiles=[]){
  if(!Array.isArray(changes)||changes.length===0||changes.length>MAX_FILES) throw new Error('sandbox_change_set_invalid');
  const seen=new Set();
  for(const c of changes){
    if(!c||typeof c.path!=='string'||seen.has(c.path)) throw new Error('sandbox_path_invalid');
    if(c.path.startsWith('/')||c.path.includes('..')||!ALLOWED_PATH.test(c.path)||FORBIDDEN_PATH.test(c.path)||c.path.startsWith('.github/workflows/')) throw new Error('sandbox_unsafe_path:'+c.path);
    if(evaluatorFiles.includes(c.path)) throw new Error('sandbox_evaluator_tampering:'+c.path);
    if(typeof c.content!=='string'||Buffer.byteLength(c.content,'utf8')>MAX_FILE_BYTES) throw new Error('sandbox_content_invalid:'+c.path);
    seen.add(c.path);
  }
}

function run(command,args,cwd,{timeoutMs=30000,env={}}={}){
  return new Promise(resolveResult=>{
    const child=spawn(command,args,{cwd,env:{...process.env,...env},stdio:['ignore','pipe','pipe'],shell:false});
    let stdout='',stderr='';
    const timer=setTimeout(()=>{child.kill('SIGKILL');resolveResult({ok:false,error:'timeout',code:null,stdout,stderr})},timeoutMs);
    child.stdout.on('data',d=>{stdout+=d}); child.stderr.on('data',d=>{stderr+=d});
    child.on('error',e=>{clearTimeout(timer);resolveResult({ok:false,error:e.message,stdout,stderr})});
    child.on('close',(code,signal)=>{clearTimeout(timer);resolveResult({ok:code===0,code,signal,stdout,stderr})});
  });
}

async function cloneWorktree(root){
  const dir=await mkdtemp(join(tmpdir(),'army14-lab-'));
  const result=await run('git',['clone','--no-hardlinks','--local',root,dir],root,{timeoutMs:60000});
  if(!result.ok){await rm(dir,{recursive:true,force:true});throw new Error('sandbox_clone_failed:'+result.stderr)}
  return dir;
}

async function applyChanges(root,changes){
  for(const c of changes){
    const target=resolve(root,c.path);
    if(target!==root&&!target.startsWith(root+'/')) throw new Error('sandbox_escape');
    await mkdir(dirname(target),{recursive:true});
    await writeFile(target,c.content,'utf8');
  }
}

async function verifySyntax(root,changes){
  for(const c of changes){
    if(!/\.(mjs|js|cjs)$/i.test(c.path)) continue;
    const r=await run(process.execPath,['--check',c.path],root,{timeoutMs:15000});
    if(!r.ok) return {ok:false,error:'syntax_failed:'+c.path,stdout:r.stdout,stderr:r.stderr};
  }
  return {ok:true};
}

const TEST_PATH=/^(apps\/army14-evolution-lab\/test-[a-z0-9._-]+\.mjs|apps\/easy-developer-platform\/test-[a-z0-9._-]+\.mjs)$/i;
async function runTests(root,testPaths=[],timeoutMs=120000){
  const paths=testPaths.filter(p=>TEST_PATH.test(p));
  if(paths.length===0) return {ok:true,tests:[],skipped:true};
  const r=await run(process.execPath,['--test',...paths],root,{timeoutMs,env:{CI:'1',NO_NETWORK:'1',LAB_SANDBOX:'1'}});
  return {ok:r.ok,tests:paths,stdout:r.stdout,stderr:r.stderr,code:r.code};
}

export async function executeInSandbox({root=process.cwd(),changes,evaluatorFiles=[],testPaths=[],timeoutMs=120000}={}){
  validateChanges(changes,evaluatorFiles);
  const sandbox=await cloneWorktree(resolve(root));
  const started=Date.now();
  try{
    const before=await run('git',['rev-parse','HEAD'],sandbox);
    await applyChanges(sandbox,changes);
    const syntax=await verifySyntax(sandbox,changes);
    if(!syntax.ok) return {status:'REJECTED',reason:syntax.error,baseSha:before.stdout.trim(),durationMs:Date.now()-started};
    const tests=await runTests(sandbox,testPaths,timeoutMs);
    const diff=await run('git',['diff','--check'],sandbox,{timeoutMs:15000});
    const status=tests.ok&&diff.ok?'VERIFIED':'REJECTED';
    return {status,baseSha:before.stdout.trim(),durationMs:Date.now()-started,syntax,tests,diffCheck:{ok:diff.ok,stdout:diff.stdout,stderr:diff.stderr},changedFiles:changes.map(c=>c.path)};
  } finally {
    await rm(sandbox,{recursive:true,force:true});
  }
}
