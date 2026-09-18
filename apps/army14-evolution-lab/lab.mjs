import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ROOT = process.cwd();
const LAB_SCHEMA = 'ARMY-14 Evolution Lab';
const VERIFICATION_CONTRACT = 'independent verification';
const SOLDIERS = [
  ['01','architect'],['02','builder'],['03','ui-ux'],['04','backend-api'],['05','database'],
  ['06','security'],['07','integration'],['08','ai-agent'],['09','test-qa'],['10','browser-e2e'],
  ['11','debug-repair'],['12','deployment-ops'],['13','product-mvp'],['14','research-capability'],
];
const TARGETS = Object.freeze({
  EASY: ['npm','run','test:elite'],
  MONY: ['npm','run','test:mony'],
});
const REQUIRED_HEADINGS = [
  '## Elite capability contract',
  '## Elite operating mode',
  '## Execution loop',
  '## Quality bar',
  '## Advanced upgrade',
];

function run(command, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, { cwd: ROOT, env: process.env, stdio: ['ignore','pipe','pipe'] });
    let stdout = '', stderr = '', settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({ ...result, durationMs: Date.now() - started, stdout, stderr });
    };
    child.stdout.on('data', (x) => { stdout += x; });
    child.stderr.on('data', (x) => { stderr += x; });
    child.on('error', (error) => finish({ ok:false, code:null, error:error.message }));
    child.on('close', (code) => finish({ ok: code === 0, code }));
    setTimeout(() => { child.kill('SIGTERM'); finish({ ok:false, code:null, error:'timeout' }); }, timeoutMs);
  });
}

async function soldierContract(id, name) {
  const path = `.github/agents/${id}-${name}-soldier.agent.md`;
  try {
    const source = await readFile(path, 'utf8');
    const checks = REQUIRED_HEADINGS.map((heading) => ({ heading, ok: source.includes(heading) }));
    checks.push({ heading:'verification/evidence', ok:/verification|evidence/i.test(source) });
    checks.push({ heading:'recovery/resilience', ok:/recovery|resilience|rollback/i.test(source) });
    return { path, ok: checks.every((x) => x.ok), checks };
  } catch (error) {
    return { path, ok:false, checks:[], error:error.message };
  }
}

async function main() {
  const mutation = process.env.LAB_MUTATION ?? 'control-baseline';
const phase = process.env.LAB_PHASE ?? 'candidate';
  const targetRuns = {};
  for (const [target, command] of Object.entries(TARGETS)) {
    targetRuns[target] = await run(command[0], command.slice(1));
  }

  const results = [];
  for (const [id, name] of SOLDIERS) {
    const contract = await soldierContract(id, name);
    for (const target of Object.keys(TARGETS)) {
      const targetOk = targetRuns[target].ok;
      const score = (Number(contract.ok) + Number(targetOk)) / 2;
      results.push({
        target, soldier:`${id}-${name}`, mutation,
        score, contractOk:contract.ok, targetOk,
        contractChecks:contract.checks,
        targetDurationMs:targetRuns[target].durationMs,
      });
    }
  }

  const total = results.length;
  const fullPasses = results.filter((x) => x.score === 1).length;
  const report = {
    schema:'army14-evolution-lab/v2',
    generatedAt:new Date().toISOString(),
    mutation,
    phase,
    targets:Object.fromEntries(Object.entries(targetRuns).map(([k,v]) => [k,{ok:v.ok,code:v.code,durationMs:v.durationMs}])),
    soldiers:SOLDIERS.length,
    totalExperiments:total,
    fullPasses,
    passRate:total ? fullPasses / total : 0,
    verdict:fullPasses === total ? 'CONTROL_VERIFIED' : 'CONTROL_FAILED',
    promotion:'BLOCKED',
    reason:'Control evidence is not mutation evidence. A candidate mutation must be rerun and independently verified before promotion.',
    results,
  };

  await mkdir('.lab/results',{recursive:true});
  await writeFile(`.lab/results/${phase}.json`,JSON.stringify(report,null,2));
  await writeFile('.lab/results/latest.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({
    schema:report.schema, mutation:report.mutation, soldiers:report.soldiers,
    totalExperiments:report.totalExperiments, fullPasses:report.fullPasses,
    passRate:report.passRate, verdict:report.verdict, promotion:report.promotion,
  }));
}
main().catch((error)=>{ console.error(error); process.exitCode=1; });
