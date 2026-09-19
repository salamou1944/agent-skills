import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { discoverGaps } from './evolution-research.mjs';
import { generateCandidates } from './evolution-mutation-generator.mjs';
import { independentlyVerify } from './evolution-independent-verifier.mjs';
import { recordNegativeKnowledge } from './evolution-negative-knowledge.mjs';

function run(cmd,args,cwd,timeout=300000){return new Promise(res=>{const p=spawn(cmd,args,{cwd,stdio:['ignore','pipe','pipe']});let o='',e='';const t=setTimeout(()=>{p.kill('SIGKILL');res({ok:false,timeout:true,stdout:o,stderr:e})},timeout);p.stdout.on('data',d=>o+=d);p.stderr.on('data',d=>e+=d);p.on('close',c=>{clearTimeout(t);res({ok:c===0,code:c,stdout:o,stderr:e})});p.on('error',x=>{clearTimeout(t);res({ok:false,error:x.message,stdout:o,stderr:e})})})}

export async function runEvolution({workspace='.',projectId,experimentId='evolution-run',candidateCount=4,outputDir='evolution',config=process.env}){
  const root=resolve(workspace);
  const temp=await mkdtemp(join(tmpdir(),'evolution-frontier-'));
  const report=await discoverGaps(root,projectId,experimentId);
  const reportPath=join(temp,'gap-report.json');
  const manifestPath=join(temp,'manifest.json');
  const evidencePath=join(temp,'evidence.json');
  const independentPath=join(temp,'independent.json');
  const ledger=resolve(root,outputDir,'negative-knowledge.jsonl');
  await writeFile(reportPath,JSON.stringify(report,null,2));
  try{
    const generated=await generateCandidates({gapReport:report,projectId,baselineRevision:report.baseline_revision,candidateCount,config});
    const manifest={...generated,experiment_id:experimentId,tests:[{name:'git-diff-check',cmd:'git',args:['diff','--check']}],attacks:[{name:'workflow-boundary',cmd:'git',args:['diff','--name-only']}],workspace:root,output:evidencePath};
    await writeFile(manifestPath,JSON.stringify(manifest,null,2));
    const orchestrator=join(root,'apps/easy-developer-platform/evolution-orchestrator.mjs');
    const runResult=await run(process.execPath,[orchestrator,manifestPath],root);
    if(!runResult.ok)throw new Error(`orchestrator_rejected:${runResult.stderr||runResult.stdout}`);
    const evidence=JSON.parse(await readFile(evidencePath,'utf8'));
    const independent=await independentlyVerify({workspace:root,manifest,evidence});
    await writeFile(independentPath,JSON.stringify(independent,null,2));
    if(independent.status!=='INDEPENDENTLY_VERIFIED'){
      await recordNegativeKnowledge(ledger,{project_id:projectId,experiment_id:experimentId,type:'independent-verification-rejection',survivor:evidence.survivor,reason:'independent_verification_failed',evidence_hash:independent.evidence_hash});
      throw new Error('independent_verification_rejected');
    }
    return {status:'EVOLUTION_VERIFIED',project_id:projectId,experiment_id:experimentId,baseline_revision:report.baseline_revision,survivor:evidence.survivor,evidence_hash:evidence.evidence_hash,independent_evidence_hash:independent.evidence_hash,gaps:report.gaps};
  }catch(error){
    await recordNegativeKnowledge(ledger,{project_id:projectId,experiment_id:experimentId,type:'evolution-run-rejection',reason:error.message,gaps:report.gaps});
    throw error;
  }finally{await rm(temp,{recursive:true,force:true})}
}

if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const [workspace='.',projectId='EVOLUTION-LAB',experimentId='evolution-run',candidateCount='4',outputDir='evolution']=process.argv.slice(2);
  const result=await runEvolution({workspace,projectId,experimentId,candidateCount:Number(candidateCount),outputDir});
  console.log(JSON.stringify(result,null,2));
}
