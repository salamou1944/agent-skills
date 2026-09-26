const MUTATIONS=new Set(['write','merge','deploy','delete','production-mutation','credential-change']);
export function reviewRequired(task,{action}={}) {
  if (!MUTATIONS.has(action)) return {required:false,reason:'read_or_non_mutating'};
  if (task.constraints?.includes('no-mutation')) return {required:true,reason:'task_disallows_mutation'};
  if (task.constraints?.includes('approval-required')) return {required:true,reason:'explicit_approval_required'};
  return {required:false,reason:'authorized_mutation'};
}
export function enforceReview(task,action,approved=false) {
  const gate=reviewRequired(task,{action});
  if (gate.required&&!approved) return {ok:false,state:'REVIEW_REQUIRED',reason:gate.reason};
  return {ok:true,state:'AUTHORIZED'};
}
