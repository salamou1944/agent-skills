#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root=process.argv[2]||'.';
const required=['.agents/skills/truth-evidence-guardian/SKILL.md','.agents/skills/runtime-verification-operator/SKILL.md','.agents/skills/recovery-orchestrator/SKILL.md','.agents/skills/platform-supervisor/SKILL.md','scripts/platform-runtime-check.mjs','scripts/platform-repo-audit.mjs'];
const missing=[];for(const p of required){try{await readFile(join(root,p),'utf8')}catch{missing.push(p)}}
async function walk(dir,out=[]){for(const e of await readdir(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(e.name))continue;const p=join(dir,e.name);e.isDirectory()?await walk(p,out):out.push(p)}return out}
const files=await walk(root);const skills=files.filter(x=>x.includes(`${join('.agents','skills')}`)&&x.endsWith('SKILL.md')).length;
const status=missing.length?'FAILED':'VERIFIED';
console.log(JSON.stringify({tool:'platform-repo-audit',status,skills,required,missing,checkedAt:new Date().toISOString()},null,2));
if(missing.length)process.exitCode=1;
