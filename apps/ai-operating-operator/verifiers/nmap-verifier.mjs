export function verifyNmapResult({result,target}={}){
  const errors=[];
  if(!result||typeof result!=='object')errors.push('result_missing');
  if(result?.target!==target)errors.push('target_mismatch');
  if(!Array.isArray(result?.args)||!result.args.includes(target))errors.push('target_not_in_executed_args');
  if(result?.result?.status!=='completed')errors.push('execution_not_completed');
  if(result?.result?.code!==0)errors.push('exit_code_not_zero');
  return {passed:errors.length===0,verifierId:'nmap-independent-verifier-v1',errors,observedTarget:result?.target||null,observedExecutionId:result?.executionId||null};
}
