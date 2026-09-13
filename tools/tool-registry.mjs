import fs from 'node:fs';

export function loadRegistry(path = 'tools/registry.json') {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const TRUST_SCORE = { A: 5, B: 4, C: 2, D: 0 };
const TIER_SCORE = { 'first-party': 5, reference: 4, 'first-party-ecosystem': 3, community: 1 };

export function scoreCandidate(candidate, requiredCapability) {
  let score = 0;
  if (candidate.capability === requiredCapability) score += 100;
  score += TRUST_SCORE[candidate.trust || 'D'] * 10;
  score += TIER_SCORE[candidate.tier || 'community'];
  if (candidate.status === 'accepted') score += 8;
  if (candidate.evidence?.security) score += 2;
  if (candidate.evidence?.testability) score += 2;
  return score;
}

export function discoverTools(registry, requiredCapability, { limit = 5, includeCandidates = true } = {}) {
  const candidates = registry.candidates.filter((c) =>
    (includeCandidates || c.status === 'accepted') &&
    (!requiredCapability || c.capability === requiredCapability || c.capabilities?.includes(requiredCapability))
  );
  return candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, requiredCapability) }))
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, limit);
}

export function selectTool(registry, requiredCapability) {
  const [best] = discoverTools(registry, requiredCapability, { limit: 1, includeCandidates: false });
  return best?.candidate ?? null;
}
