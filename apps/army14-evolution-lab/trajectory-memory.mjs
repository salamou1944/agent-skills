import { createHash } from 'node:crypto';
export function trajectoryEvent({experimentId, phase, outcome, failureSignature=null, lesson=null, nextConstraint=null}={}){
  if(!experimentId || !phase || !outcome) throw new Error('trajectory_event_invalid');
  return {schema:'army14-evolution-lab/trajectory/v1',id:createHash('sha256').update(JSON.stringify({experimentId,phase,outcome,failureSignature,lesson,nextConstraint})).digest('hex').slice(0,20),experimentId,phase,outcome,failureSignature,lesson,nextConstraint};
}
export function learnFromFailures(events=[]){
  const counts=new Map();
  for(const e of events){ if(e.failureSignature) counts.set(e.failureSignature,(counts.get(e.failureSignature)||0)+1); }
  return [...counts.entries()].map(([signature,count])=>({signature,count,repeated:count>1,action:count>1?'convert_to_hard_constraint':'retain_as_observation'}));
}
