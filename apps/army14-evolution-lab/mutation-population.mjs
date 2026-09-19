import { createHash } from 'node:crypto';
import { validateMutationPlan } from './mutation-engine.mjs';

export function buildPopulation(hypothesis, seeds=[], limit=8){
  if(!hypothesis?.id) throw new Error('hypothesis id required');
  return seeds.slice(0,limit).map((seed,index)=>{
    const mutation={...seed, hypothesisId:hypothesis.id, populationIndex:index};
    const id=createHash('sha256').update(JSON.stringify(mutation)).digest('hex').slice(0,20);
    const plan={...mutation,id};
    const validation=validateMutationPlan(plan);
    return {id, hypothesisId:hypothesis.id, index, plan, validation, expected: hypothesis.expected, falsifier:hypothesis.falsifier};
  });
}

export function selectExecutable(population){
  return population.filter(x=>x.validation?.ok===true);
}
