import { parallelChecks } from './elite-reviewer.mjs';

export async function runParallelReview({ goal, patch, changes, reviewer }) {
  const results = await parallelChecks({
    correctness: () => reviewer({ role: 'correctness', goal, patch, changes }),
    security: () => reviewer({ role: 'security', goal, patch, changes }),
    regression: () => reviewer({ role: 'regression', goal, patch, changes })
  });
  const failed = Object.entries(results).filter(([, result]) => result?.approved !== true);
  return { ok: failed.length === 0, results, failedRoles: failed.map(([role]) => role) };
}
