import assert from 'node:assert/strict';
import { validateSoatExecutionEvidence, requireSoatExecutionEvidence } from './soat-evidence-gate.mjs';

const valid = {
  schema:'soat-execution-evidence/v1', verified:true,
  runId:'37361178767', commit:'3fd02f490369d7ca184e9a9420845e50252354bc',
  soatSha:'600721c1fa30de27c14f6da5e5917049a5339036', evidenceLevel:'provider',
  scope:'ci-pinned-local-runtime', productionStatus:'not_proven',
  gates:{health:true,authentication:true,provider_resolved:true,api_factory_probe:true,real_chat_completion:true,official_smoke_suite:true}
};
assert.equal(validateSoatExecutionEvidence(valid).ok,true);
assert.equal(validateSoatExecutionEvidence({...valid,gates:{...valid.gates,real_chat_completion:false}}).ok,false);
assert.equal(validateSoatExecutionEvidence({...valid,runId:null}).reason,'soat_evidence_provenance_missing');
assert.throws(()=>requireSoatExecutionEvidence({...valid,verified:false}),/soat_evidence_not_verified/);
console.log('SOAT evidence gate: OK');
