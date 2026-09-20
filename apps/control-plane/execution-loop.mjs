const PHASES = Object.freeze([
  'DISCOVERED','SELECTED','EXECUTING','TESTING','VERIFYING','OBSERVING',
  'PERSISTING','BLOCKED_EXTERNAL_DEPENDENCY','COMPLETED','FAILED',
]);
const TERMINAL = new Set(['COMPLETED','FAILED']);
const TRANSITIONS = Object.freeze({
  DISCOVERED:['SELECTED','FAILED'],
  SELECTED:['EXECUTING','BLOCKED_EXTERNAL_DEPENDENCY','FAILED'],
  EXECUTING:['TESTING','FAILED','BLOCKED_EXTERNAL_DEPENDENCY'],
  TESTING:['VERIFYING','FAILED'],
  VERIFYING:['OBSERVING','FAILED'],
  OBSERVING:['PERSISTING','FAILED'],
  PERSISTING:['COMPLETED','FAILED'],
  BLOCKED_EXTERNAL_DEPENDENCY:['SELECTED','EXECUTING','FAILED'],
  COMPLETED:[], FAILED:[],
});
const EXTERNAL_BLOCKERS = new Set(['provider','credentials','billing','quota','external_service','human_approval']);
function requiredString(value,field){if(!String(value||'').trim())throw new Error(`execution_${field}_required`);return String(value)}
function normalizeEvidence(evidence){
  if(!Array.isArray(evidence))throw new Error('execution_evidence_array_required');
  return evidence.map(item=>{
    if(typeof item==='string')return item;
    if(!item||typeof item!=='object'||!String(item.source||'').trim())throw new Error('execution_evidence_source_required');
    return {...item,source:String(item.source)};
  });
}
export function createExecutionState({id,project,frontierId,phase='DISCOVERED',evidence=[],blocker=''}){
  requiredString(id,'id');requiredString(project,'project');requiredString(frontierId,'frontier_id');
  if(!PHASES.includes(phase))throw new Error('execution_phase_invalid');
  return Object.freeze({schemaVersion:1,id:String(id),project:String(project),frontierId:String(frontierId),phase,evidence:Object.freeze(normalizeEvidence(evidence)),blocker:String(blocker||'')});
}
export function transitionExecution(state,nextPhase,{evidence=[],blocker=''}={}){
  if(!state||!PHASES.includes(state.phase))throw new Error('execution_state_invalid');
  if(!PHASES.includes(nextPhase))throw new Error('execution_next_phase_invalid');
  if(!TRANSITIONS[state.phase].includes(nextPhase))throw new Error(`execution_transition_not_allowed:${state.phase}->${nextPhase}`);
  const phaseEvidence=normalizeEvidence(evidence);
  if(nextPhase==='VERIFYING'&&phaseEvidence.length===0)throw new Error('execution_verification_requires_evidence');
  if(nextPhase==='PERSISTING'&&phaseEvidence.length===0)throw new Error('execution_persistence_requires_evidence');
  if(nextPhase==='COMPLETED'&&phaseEvidence.length===0)throw new Error('execution_completion_requires_evidence');
  if(nextPhase==='FAILED'&&phaseEvidence.length===0)throw new Error('execution_failure_requires_evidence');
  if(nextPhase==='BLOCKED_EXTERNAL_DEPENDENCY'){
    const normalized=String(blocker||'').trim().toLowerCase();
    if(!EXTERNAL_BLOCKERS.has(normalized))throw new Error('execution_external_blocker_class_invalid');
  }
  return createExecutionState({id:state.id,project:state.project,frontierId:state.frontierId,phase:nextPhase,evidence:[...state.evidence,...phaseEvidence],blocker});
}
export function buildExecutionPlan(frontier){
  if(!frontier||typeof frontier!=='object')throw new Error('execution_frontier_required');
  const id=requiredString(frontier.id,'frontier_id'),project=requiredString(frontier.project,'project');
  const action=requiredString(frontier.nextAction||frontier.experiment,'action');
  const blocked=frontier.status==='BLOCKED_EXTERNAL_DEPENDENCY'||frontier.externalDependencyBlocked===true;
  const dependency=Array.isArray(frontier.dependencies)?frontier.dependencies.find(value=>EXTERNAL_BLOCKERS.has(String(value))):null;
  return Object.freeze({schemaVersion:1,frontierId:id,project,action,startPhase:blocked||dependency?'BLOCKED_EXTERNAL_DEPENDENCY':'SELECTED',
    steps:Object.freeze(['EXECUTING','TESTING','VERIFYING','OBSERVING','PERSISTING','COMPLETED']),
    evidenceRequiredAt:Object.freeze(['VERIFYING','PERSISTING','COMPLETED']),blockedDependency:blocked||dependency?String(dependency||'external'):null});
}
export {EXTERNAL_BLOCKERS,PHASES,TERMINAL,TRANSITIONS};
