export function buildFalsifier(hypothesis){
  if(!hypothesis?.id) throw new Error('hypothesis_required');
  const text=String(hypothesis.falsifier||'').trim();
  if(text.length>=12) return text;
  return 'Reject the mutation if independent verification shows no measurable improvement in '+String(hypothesis.expected||'the expected signal')+', or if any previously passing invariant regresses.';
}
export function evaluateFalsifier({falsifier,independentResult,baselineResult,candidateResult}={}){
  if(!falsifier) return {ok:false,reason:'falsifier_missing'};
  if(independentResult?.status!=='VERIFIED') return {ok:false,reason:'independent_verification_missing'};
  const cp=Number(candidateResult?.passRate),bp=Number(baselineResult?.passRate);
  if(Number.isFinite(cp)&&Number.isFinite(bp)&&cp<bp) return {ok:false,reason:'candidate_regressed'};
  return {ok:true,falsifier,independent:true};
}
