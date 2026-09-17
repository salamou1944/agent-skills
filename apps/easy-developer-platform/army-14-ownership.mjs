#!/usr/bin/env node

export const DEFAULT_SOLDIER_OWNERSHIP = Object.freeze({
  Architect:['docs/','knowledge-bank/'], Builder:['services/','src/','apps/'], 'UI/UX':['app/','pages/','components/','public/'],
  'Backend/API':['api/','services/','routes/'], Database:['migrations/','schema/','database/','supabase/'], Security:['SECURITY.md','.security/'],
  Integration:['commerce-connector/','integrations/'], 'AI-Agent':['skills/','apps/easy-developer-platform/'], 'Test-QA':['test/','tests/','*.test.*','*.spec.*'],
  'Browser-E2E':['e2e/','playwright/','cypress/'], 'Debug-Repair':['*'], 'Deployment-Ops':['.github/workflows/','Dockerfile','railway.json','vercel.json'],
  'Product-MVP':['README.md','product/'], 'Research-Capability':['research/','knowledge-bank/','api-registry/']
});

function matches(path, rule) { if (rule === '*') return true; if (rule.endsWith('/')) return path.startsWith(rule); if (rule.startsWith('*.')) return path.endsWith(rule.slice(1)); return path === rule; }

export function detectOwnershipConflicts(assignments, ownership = DEFAULT_SOLDIER_OWNERSHIP) {
  const conflicts = [];
  for (let i=0;i<assignments.length;i+=1) for (let j=i+1;j<assignments.length;j+=1) {
    for (const path of assignments[i].paths || []) if ((assignments[j].paths || []).includes(path)) conflicts.push({ path, soldiers:[assignments[i].soldier, assignments[j].soldier], reason:'same_file' });
  }
  for (const assignment of assignments) {
    const rules = ownership[assignment.soldier] || [];
    for (const path of assignment.paths || []) if (rules.length && !rules.some(rule => matches(path, rule))) conflicts.push({ path, soldier:assignment.soldier, reason:'outside_ownership' });
  }
  return conflicts;
}

export function assertNoOwnershipConflicts(assignments, ownership) {
  const conflicts = detectOwnershipConflicts(assignments, ownership);
  if (conflicts.length) throw new Error(`army14_ownership_conflict:${JSON.stringify(conflicts)}`);
  return { ok:true, assignments:assignments.length };
}
