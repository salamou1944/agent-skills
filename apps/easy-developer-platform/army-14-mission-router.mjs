import { SOLDIER_SYSTEMS } from './soldier-systems/army-14-systems.mjs';

const ROUTES = Object.freeze({
  architect:['architecture','inspection','requirements'],
  builder:['implementation','creative','seller-product','commerce'],
  'ui-ux':['ui','experience','browser'],
  'backend-api':['api','runtime','gateway'],
  database:['database','data','persistence'],
  security:['security','auth','integrity'],
  integration:['integration','affiliate','payment','provider'],
  'ai-agent':['ai','llm','agent','orchestration'],
  'test-qa':['test','qa','acceptance','regression'],
  'browser-e2e':['e2e','browser','journey'],
  'debug-repair':['repair','defect','blocker','failure'],
  'deployment-ops':['deploy','railway','release','health'],
  'product-mvp':['product','mvp','revenue','seller'],
  'research-capability':['research','market','capability','opportunity'],
});

export function routeMission(task) {
  const text=`${task?.id||''} ${task?.scope||''} ${task?.goal||''}`.toLowerCase();
  let best=null;
  for (const soldier of SOLDIER_SYSTEMS) {
    const keys=ROUTES[soldier.name]||[];
    const score=keys.reduce((n,key)=>n+(text.includes(key)?1:0),0);
    if(score>0 && (!best || score>best.score)) best={score,soldier};
  }
  const fallback=SOLDIER_SYSTEMS.find(s=>s.id==='13');
  return {soldierId:(best?.soldier||fallback).id,soldier:(best?.soldier||fallback).name,score:best?.score||0,reason:best?'keyword-domain-match':'product-mvp-fallback'};
}

export function routeAll(tasks){ return tasks.map(task=>({taskId:task.id,...routeMission(task)})); }
