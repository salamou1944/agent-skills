export function evaluateExecutionOutcome(result,{requireIndependentVerification=true}={}) {
  const evidence=Array.isArray(result?.evidence)?result.evidence:[];
  const hasIndependentVerification=evidence.some(item =>
    item?.type==='independent_verification' ||
    item?.kind==='independent_verification' ||
    item?.verification==='independent' ||
    item?.source==='independent_verifier'
  );
  const actionObserved=evidence.some(item =>
    item?.type==='action' || item?.kind==='action' || item?.kind==='execution' || item?.source==='executor'
  );
  if (result?.completion?.ok===true && (!requireIndependentVerification || (actionObserved && hasIndependentVerification))) {
    return {
      state:'VERIFIED',
      outcome:'VERIFIED_OUTCOME',
      independentlyVerified:hasIndependentVerification,
      actionObserved
    };
  }
  if (result?.completion?.ok===true) {
    return {
      state:'VERIFICATION_FAILED',
      outcome:'VERIFICATION_FAILED',
      independentlyVerified:hasIndependentVerification,
      actionObserved,
      reason:'task completion lacks independent postcondition evidence'
    };
  }
  return {
    state:result?.state||'FAILED',
    outcome:result?.state==='BLOCKED_EXTERNAL_DEPENDENCY'?'BLOCKED_EXTERNAL':'FAILED_EXECUTION',
    independentlyVerified:hasIndependentVerification,
    actionObserved
  };
}

export function buildReplanDecision(result,{retryable=false,nextTaskId=null}={}) {
  const evaluation=evaluateExecutionOutcome(result);
  if (evaluation.state==='VERIFIED') {
    return {decision:nextTaskId?'NEXT_TASK':'NO_REPLAN',sourceState:'VERIFIED',nextTaskId};
  }
  return {
    decision:retryable?'RETRY':'BLOCK',
    sourceState:evaluation.state,
    nextTaskId:null,
    reason:evaluation.reason||result?.failure?.message||'execution did not produce a verified outcome'
  };
}
