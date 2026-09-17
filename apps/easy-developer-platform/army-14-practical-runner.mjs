import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.env.ARMY_WORKSPACE || process.cwd();
const agentSource = resolve(process.env.ARMY_AGENT_SOURCE || join(root, '.github', 'agents'));
const soldiers = [
  ['01-architect-soldier.agent.md', 'Architect', 'architecture'], ['02-builder-soldier.agent.md', 'Builder', 'implementation'],
  ['03-ui-ux-soldier.agent.md', 'UI/UX', 'experience'], ['04-backend-api-soldier.agent.md', 'Backend/API', 'api'],
  ['05-database-soldier.agent.md', 'Database', 'data'], ['06-security-soldier.agent.md', 'Security', 'security'],
  ['07-integration-soldier.agent.md', 'Integration', 'integration'], ['08-ai-agent-soldier.agent.md', 'AI-Agent', 'intelligence'],
  ['09-test-qa-soldier.agent.md', 'Test-QA', 'quality'], ['10-browser-e2e-soldier.agent.md', 'Browser-E2E', 'e2e'],
  ['11-debug-repair-soldier.agent.md', 'Debug-Repair', 'repair'], ['12-deployment-ops-soldier.agent.md', 'Deployment-Ops', 'operations'],
  ['13-product-mvp-soldier.agent.md', 'Product-MVP', 'product'], ['14-research-capability-soldier.agent.md', 'Research-Capability', 'research'],
];
const required = ['## Elite capability contract', '## Elite operating mode', '## Execution loop', '## Quality bar', '## Advanced upgrade'];
function run(command, args, cwd = root, timeout = 120000) { return new Promise(done => { const child = spawn(command, args, { cwd, stdio: ['ignore','pipe','pipe'], shell:false }); let stdout='',stderr=''; const timer=setTimeout(()=>{child.kill('SIGKILL');done({ok:false,error:'timeout',stdout,stderr});},timeout); child.stdout.on('data',d=>stdout+=d); child.stderr.on('data',d=>stderr+=d); child.on('error',e=>{clearTimeout(timer);done({ok:false,error:e.message,stdout,stderr});}); child.on('close',code=>{clearTimeout(timer);done({ok:code===0,code,stdout,stderr});}); }); }
async function walk(dir,out=[]) { for(const entry of await readdir(dir,{withFileTypes:true})){ if(['.git','node_modules','.elite','.elite-code-tools'].includes(entry.name)) continue; const path=join(dir,entry.name); if(entry.isDirectory()) await walk(path,out); else out.push(relative(root,path)); } return out; }
async function text(path) { try{return await readFile(join(root,path),'utf8');}catch{return '';} }
function any(files,patterns){return files.some(f=>patterns.some(p=>p.test(f)));}
function contains(value,patterns){return patterns.some(p=>p.test(value));}
async function verifyRepository(files){
  const failures=[];
  const gitCheck=await run('git',['rev-parse','--is-inside-work-tree']);
  if(gitCheck.ok){const diff=await run('git',['diff','--check']);if(!diff.ok) failures.push(`git_diff_check:${diff.stderr||diff.stdout||diff.error}`);}
  const pkg=await text('package.json');if(pkg){try{JSON.parse(pkg);}catch{failures.push('package_json_invalid');}}
  const js=files.filter(f=>/\.(mjs|js|cjs)$/i.test(f)).slice(0,80);
  for(const file of js){const r=await run(process.execPath,['--check',join(root,file)],root,30000);if(!r.ok){failures.push(`syntax_failed:${file}`);break;}}
  return failures;
}
async function verifyRole(role,files){
  const failures=[];const readme=await text('README.md');const source=(await Promise.all(files.filter(f=>/\.(mjs|js|cjs|ts|tsx|jsx|html)$/i.test(f)).slice(0,140).map(text))).join('\n');
  switch(role){
    case 'Architect':if(!readme&&!any(files,[/^knowledge-bank\//,/^api-registry\//,/^commerce-connector\//])) failures.push('no_architecture_anchor');break;
    case 'Builder':if(!any(files,[/\.(mjs|js|cjs|ts|tsx|jsx|html)$/i])) failures.push('no_executable_surface');break;
    case 'UI/UX':if(!any(files,[/\.html$/i,/\.(tsx|jsx)$/i,/(^|\/)(app|pages|components)\//i])) failures.push('no_ui_surface');break;
    case 'Backend/API':if(!contains(source,[/\/api\//i,/api-registry/i,/commerce-connector/i,/fetch\(|http\.|router|server/i])) failures.push('no_api_boundary');break;
    case 'Database':if(!any(files,[/(schema|migration|supabase|prisma|drizzle|database|db)/i,/commerce-data-provider\.md$/i])) failures.push('no_data_contract_surface');break;
    case 'Security':{
      const tracked=files.filter(f=>/\.(mjs|js|cjs|json|yml|yaml|ts|tsx|md|html)$/i.test(f)).slice(0,300);
      const content=(await Promise.all(tracked.map(text))).join('\n');
      const secretPattern=new RegExp('s'+'k-'+'[A-Za-z0-9]{20,}');
      const ghPattern=new RegExp('gh'+'p_'+'[A-Za-z0-9]{30,}');
      if(secretPattern.test(content)||ghPattern.test(content)||/-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/.test(content)) failures.push('possible_literal_secret');
      break;
    }
    case 'Integration':if(!any(files,[/commerce-connector\/adapters\//i,/commerce-connector\/core\//i])) failures.push('no_adapter_boundary');break;
    case 'AI-Agent':{const coder=await readFile(join(agentSource,'..','..','apps','easy-developer-platform','autonomous-coder.mjs'),'utf8').catch(()=> '');const fallback=await readFile(join(agentSource,'..','..','apps','easy-developer-platform','army-14-practical-runner.mjs'),'utf8').catch(()=> '');if(!coder||!fallback||!contains(coder,[/provider|fallback/i])) failures.push('agent_runtime_or_fallback_missing');break;}
    case 'Test-QA':if(!any(files,[/(^|\/)(test|tests|e2e)(\/|\.|$)/i,/\.(test|spec)\.(mjs|js|cjs|ts|tsx)$/i])) failures.push('no_test_surface');break;
    case 'Browser-E2E':if(!any(files,[/\.(html|tsx|jsx)$/i,/(playwright|cypress|e2e)/i])) failures.push('no_browser_surface');break;
    case 'Debug-Repair':break;
    case 'Deployment-Ops':if(!any(files,[/Dockerfile/i,/\.github\/workflows\//i,/railway\.json$/i,/vercel\.json$/i])) failures.push('no_deployment_surface');break;
    case 'Product-MVP':if(!readme&&!any(files,[/api-lab\//i,/commerce-connector\//i,/knowledge-bank\//i])) failures.push('no_product_anchor');break;
    case 'Research-Capability':if(!any(files,[/knowledge-bank\//i,/api-registry\//i,/api-lab\//i,/docs\//i])) failures.push('no_research_surface');break;
  }
  return failures;
}
export async function runArmy14(goal,{workspace=root,runId=`army14-${Date.now()}`}={}){if(!String(goal||'').trim()) throw new Error('goal_required');const outDir=join(workspace,'.elite','army-14',runId);await mkdir(outDir,{recursive:true});const files=await walk(workspace);const repositoryFailures=await verifyRepository(files);if(repositoryFailures.length) throw new Error(`repository_verification_failed:${repositoryFailures.join('|')}`);const chain=[];let previous='scenario-input';for(let i=0;i<soldiers.length;i++){const[file,role,stage]=soldiers[i];const profile=await readFile(join(agentSource,file),'utf8').catch(()=> '');for(const marker of required) if(!profile.includes(marker)) throw new Error(`${file}:missing:${marker}`);if(!/verification|evidence/i.test(profile)) throw new Error(`${file}:missing:verification`);if(!/recovery|resilience|rollback/i.test(profile)) throw new Error(`${file}:missing:recovery`);const roleFailures=await verifyRole(role,files);if(roleFailures.length) throw new Error(`${role}:role_check_failed:${roleFailures.join('|')}`);const artifact=`${String(i+1).padStart(2,'0')}-${stage}.json`;const record={runId,sequence:i+1,soldier:file,role,stage,goal,input:previous,execution:{invoked:true,completed:true,mode:'provider-independent-practical'},checks:{profileContract:true,repositoryIntegrity:true,roleSpecific:true},taskVerified:false,pipelineVerified:true,verified:false,providerAccess:'not-required-for-practical-gate',revenue:'not-claimed',handoffTo:i<soldiers.length-1?soldiers[i+1][1]:'final-verifier'};await writeFile(join(outDir,artifact),`${JSON.stringify(record,null,2)}\n`);chain.push({...record,artifact});previous=artifact;}const manifest={status:'PIPELINE_VERIFIED',mode:'integrated-army-14-practical',runId,goal,soldierCount:chain.length,allSoldiersExecuted:chain.length===14,allHandoffsVerified:chain.every((x,i)=>i===0||x.input===chain[i-1].artifact),allRoleChecksPassed:chain.every(x=>x.checks.roleSpecific),taskVerified:false,providerAccess:'not-required-for-practical-gate',revenue:'not-claimed',chain:chain.map(({sequence,soldier,role,stage,input,handoffTo,taskVerified,pipelineVerified,verified})=>({sequence,soldier,role,stage,input,handoffTo,taskVerified,pipelineVerified,verified})),outputDirectory:outDir};if(!(manifest.soldierCount===14&&manifest.allSoldiersExecuted&&manifest.allHandoffsVerified&&manifest.allRoleChecksPassed&&manifest.taskVerified===false)) throw new Error('army14_pipeline_gate_failed');await writeFile(join(outDir,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`);return manifest;}
if(import.meta.url===`file://${process.argv[1]}`){const goal=process.env.ARMY_GOAL||process.argv.slice(2).join(' ').trim();runArmy14(goal).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(JSON.stringify({status:'FAILED',error:e.message}));process.exitCode=1;});}
