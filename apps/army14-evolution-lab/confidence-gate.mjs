export function confidenceGate({runs=[],baseline=0,minRuns=2,maxRegression=0}={}) {
  const scores=runs.map(Number).filter(Number.isFinite);
  const mean=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;
  const variance=scores.length>1?scores.reduce((a,b)=>a+(b-mean)**2,0)/(scores.length-1):Infinity;
  const regression=runs.filter(x=>Number(x)<baseline-maxRegression).length;
  const stable=scores.length>=minRuns && regression===0 && Number.isFinite(variance);
  return {runs:scores.length,mean,variance,stable,decision:stable?'REPEATABLE':'BLOCKED'};
}