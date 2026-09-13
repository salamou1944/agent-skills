#!/usr/bin/env node
import process from 'node:process';
import { spawn } from 'node:child_process';

const root=process.argv[2]||process.cwd();
const url=process.env.EASY_PLATFORM_URL||'';
const checks=[
  ['repository-audit',process.execPath,['scripts/platform-repo-audit.mjs',root]],
  ...(url?[['runtime-check',process.execPath,['scripts/platform-runtime-check.mjs',url]]]:[])
];
const results=[];
for(const [name,cmd,args] of checks){
  const child=spawn(cmd,args,{cwd:root,stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);const code=await new Promise(resolve=>child.on('close',resolve));results.push({name,code,output:out.trim(),error:err.trim()})
}
const failed=results.filter(x=>x.code!==0);const status=failed.length?'FAILED':'VERIFIED';
console.log(JSON.stringify({tool:'platform-supervisor',status,checkedAt:new Date().toISOString(),results},null,2));
if(failed.length)process.exitCode=1;
