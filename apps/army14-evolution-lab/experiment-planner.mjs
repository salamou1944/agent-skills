import { createHash } from 'node:crypto';

export function planExperiments(population=[], budget=8) {
  const candidates=population.filter(x=>x?.validation?.ok===true).map((x,i)=>({...x,priority:score(x,i)}));
  return candidates.sort((a,b)=>b.priority-a.priority).slice(0,Math.max(0,budget));
}
function score(x,i){
  const expected=String(x.expected||'').length;
  const target=String(x.plan?.target||'').length;
  const falsifiable=String(x.falsifier||'').length;
  return expected*2+falsifiable*2+target-i;
}
export function experimentKey(candidate,condition='default'){return createHash('sha256').update(JSON.stringify({id:candidate.id,condition})).digest('hex').slice(0,20);}