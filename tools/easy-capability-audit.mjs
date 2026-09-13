import fs from 'node:fs';

const REQUIRED = [
  'product-understanding',
  'product-integrity',
  'creative-planning',
  'creative-validation',
  'seller-experience',
  'commerce-data',
  'api-contracts',
  'integration-boundary',
  'observability',
  'security'
];

export function auditEasyCapabilities({ declared = [], implemented = [], validated = [] } = {}) {
  const rows = REQUIRED.map((capability) => ({
    capability,
    declared: declared.includes(capability),
    implemented: implemented.includes(capability),
    validated: validated.includes(capability),
    status: validated.includes(capability)
      ? 'validated'
      : implemented.includes(capability)
        ? 'implemented-unvalidated'
        : declared.includes(capability)
          ? 'declared-only'
          : 'missing'
  }));

  return {
    schemaVersion: 1,
    complete: rows.every((row) => row.status === 'validated'),
    firstGap: rows.find((row) => row.status !== 'validated')?.capability ?? null,
    rows
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error('usage: node tools/easy-capability-audit.mjs <capability-state.json>');
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(JSON.stringify(auditEasyCapabilities(input), null, 2));
}
