import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ask } from './autonomous-coder.mjs';

const MAX_CANDIDATES = 6;
const PROJECTS = new Set(['EASY','MONY','ELITE','ARMY-14','EVOLUTION-LAB','AGENT-SKILLS']);

function fail(message){ throw new Error(message); }

function signature(candidate){return JSON.stringify(candidate.changes.map(x=>({path:x.path,content:x.content})).sort((a,b)=>a.path.localeCompare(b.path)));}
function validateCandidate(candidate){
  if(!candidate || typeof candidate.id !== 'string' || !candidate.id.trim()) fail('candidate_id_required');
  if(!Array.isArray(candidate.changes) || candidate.changes.length === 0) fail('candidate_changes_required');
  const paths = new Set();
  for(const change of candidate.changes){
    if(!change || typeof change.path !== 'string' || !change.path || change.path.startsWith('/') || change.path.includes('..') || change.path.startsWith('.github/workflows/')) fail('unsafe_candidate_path');
    if(paths.has(change.path)) fail('duplicate_candidate_path');
    paths.add(change.path);
    if(typeof change.content !== 'string' || change.content.length > 200000) fail('invalid_candidate_content');
  }
  return {id:candidate.id.trim(), changes:candidate.changes, rationale:String(candidate.rationale||'')};
}

export async function generateCandidates({gapReport, projectId, baselineRevision, candidateCount=4, config=process.env}){
  if(!PROJECTS.has(projectId)) fail('project_id_not_allowlisted');
  if(!baselineRevision) fail('baseline_revision_required');
  const count=Math.max(2,Math.min(MAX_CANDIDATES,Number(candidateCount)||4));
  const prompt=[
    'EVOLUTION MUTATION GENERATOR. You are a candidate architect, not a verifier and not a promoter.',
    'Return JSON only: {"candidates":[{"id":"...","changes":[{"path":"...","content":"..."}],"rationale":"..."}]}',
    `Project: ${projectId}`,
    `Immutable baseline revision: ${baselineRevision}`,
    `Generate exactly ${count} materially different candidate mutations.`,
    'Candidates must be independently useful responses to the capability gap, minimal in scope, and must never modify .github/workflows, secrets, credentials, auth policy, deployment configuration, or files outside the repository.',
    'Do not claim tests passed. Do not select a winner. Preserve uncertainty.',
    'Capability-gap evidence follows:',
    JSON.stringify(gapReport)
  ].join('\n');
  const result=await ask(prompt,{
    ...config,
    workspace:config.EASY_OPERATOR_WORKSPACE||'.',
    apiKey:config.EASY_OPERATOR_LLM_API_KEY||config.OPENAI_API_KEY||'',
    secondaryApiKey:config.EASY_OPERATOR_SECONDARY_LLM_API_KEY||'',
    githubToken:config.GITHUB_TOKEN||''
  });
  if(!Array.isArray(result?.candidates)) fail('provider_candidates_missing');
  const candidates=result.candidates.map(validateCandidate);
  if(candidates.length!==count) fail('provider_candidate_count_mismatch');
  if(new Set(candidates.map(x=>x.id)).size!==candidates.length) fail('candidate_ids_must_be_unique');
  if(new Set(candidates.map(signature)).size!==candidates.length) fail('candidate_mutations_must_be_distinct');
  return {project_id:projectId,baseline_revision:baselineRevision,candidates};
}

if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const input=process.argv[2], output=process.argv[3];
  if(!input||!output) fail('usage: evolution-mutation-generator.mjs <gap-report.json> <manifest.json>');
  const gapReport=JSON.parse(await readFile(input,'utf8'));
  const projectId=gapReport.project_id, baselineRevision=gapReport.baseline_revision;
  const generated=await generateCandidates({gapReport,projectId,baselineRevision});
  await writeFile(output,JSON.stringify({...generated,experiment_id:gapReport.experiment_id},null,2));
  console.log(JSON.stringify(generated,null,2));
}
