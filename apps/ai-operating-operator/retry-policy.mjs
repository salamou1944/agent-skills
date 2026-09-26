export function retryDecision({attempt=0,maxRetries=2,errorClass='unknown'}={}) {
  if (attempt >= maxRetries) return {retry:false,reason:'retry_budget_exhausted'};
  const retryable = new Set(['timeout','network','rate_limit','temporary_external_dependency']);
  if (!retryable.has(errorClass)) return {retry:false,reason:'non_retryable'};
  return {retry:true,attempt:attempt+1,backoffMs:Math.min(30000,1000*(2**attempt))};
}
