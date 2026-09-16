import { analyzePatch } from './elite-patch.mjs';
import { securityReview } from './elite-security.mjs';

export async function independentReview({ root, goal, changes, reviewer }) {
  const security = securityReview({ changes });
  const patch = await analyzePatch(root);
  if (!security.ok) return { ok: false, reason: 'security_gate', evidence: security.findings };
  if (!patch.ok) return { ok: false, reason: 'patch_gate', evidence: patch.findings };
  if (typeof reviewer !== 'function') return { ok: false, reason: 'reviewer_required' };
  const result = await reviewer({ goal, patch, changes: changes.map(({ path, content }) => ({ path, content })) });
  if (!result || result.approved !== true) return { ok: false, reason: 'independent_review_rejected', evidence: result || null };
  return { ok: true, evidence: { patch, security, reviewer: result } };
}

export async function parallelChecks(checks) {
  const entries = Object.entries(checks);
  const results = await Promise.all(entries.map(async ([name, fn]) => [name, await fn()]));
  return Object.fromEntries(results);
}
