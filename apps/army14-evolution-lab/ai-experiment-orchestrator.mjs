import { createHash } from 'node:crypto';
import { generateAIMutation } from './ai-mutation-generator.mjs';
import { planExperiments } from './experiment-planner.mjs';
import { confidenceGate } from './confidence-gate.mjs';
import { executeInSandbox } from './sandbox-executor.mjs';
import { buildEvidenceBundle } from './evidence-bundle.mjs';
import { buildFalsifier, evaluateFalsifier } from './mutation-falsifier.mjs';
import { promotionGateV2 } from './promotion-gate-v2.mjs';

export function cycleId(input){return 'cycle-'+createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0,20)}

export async function runAIExperimentCycle({root=process.cwd(),hypotheses=[],context={},evaluatorFiles=[],providerConfig={},budget=2,testPaths=[],mutationGenerator=generateAIMutation,executor=executeInSandbox}={}){
  const selected=planExperiments(hypotheses,budget);
  const cycle={id:cycleId({hypotheses:selected.map(x=>x.id),budget}),startedAt:new Date().toISOString(),budget,experiments:[],promotion:'BLOCKED'};
  if(!selected.length){cycle.status='NO_CANDIDATES';return cycle;}
  for(const candidate of selected){
    const falsifier=buildFalsifier(candidate);
    let generated;
    try{generated=await mutationGenerator({hypothesis:candidate,context,evaluatorFiles,target:candidate.plan?.target||candidate.target,providerConfig});}
    catch(error){cycle.experiments.push({candidateId:candidate.id,status:'AI_BLOCKED',reason:error.message,falsifier});continue}
    let result;
    try{result=await executor({root,changes:generated.plan.changes,evaluatorFiles,testPaths});}
    catch(error){cycle.experiments.push({candidateId:candidate.id,mutationId:generated.id,status:'EXECUTION_BLOCKED',reason:error.message,falsifier});continue}
    const falsification=evaluateFalsifier({falsifier,independentResult:result,baselineResult:context.baseline,candidateResult:context.candidate||{}});
    const confidence=confidenceGate({runs:[result.status==='VERIFIED'?1:0],baseline:1,minRuns:2});
    const promotion=promotionGateV2({noRegression:result.status==='VERIFIED',netGain:false,independentEvidence:false,repeatability:confidence.runs,harnessStable:false,evidenceArtifact:false,newSecurityFindings:0});
    cycle.experiments.push({candidateId:candidate.id,mutationId:generated.id,status:result.status,result,falsification,confidence,promotion});
  }
  cycle.status=cycle.experiments.some(x=>x.status==='VERIFIED')?'EXPERIMENTS_VERIFIED':'NO_VERIFIED_EXPERIMENT';
  cycle.finishedAt=new Date().toISOString();
  cycle.evidence=await buildEvidenceBundle({experimentId:cycle.id,baseSha:context.baseSha,candidate:cycle.experiments[0],results:cycle.experiments.map(x=>({status:x.status,mutationId:x.mutationId})),policy:'promotion remains blocked until independent repeated evidence'});
  return cycle;
}
if(import.meta.url===`file://${process.argv[1]}`){console.error('AI experiment orchestrator requires an explicit harness invocation.');process.exit(2);}
