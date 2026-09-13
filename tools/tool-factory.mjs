export function buildToolPackage(spec) {
  if (!spec?.id || !spec?.capability || !spec?.description) throw new Error('tool factory requires id, capability and description');
  const safe = String(spec.id).replace(/[^A-Za-z0-9_.-]/g, '-');
  const manifest = {
    id: safe,
    name: spec.name || safe,
    capability: spec.capability,
    version: spec.version || '0.1.0',
    description: spec.description,
    source: { url: spec.sourceUrl || 'local://generated', verified: false },
    license: { spdx: spec.license || 'MIT' },
    risk: spec.risk || 'low',
    permissions: [...new Set(spec.permissions || [])].sort(),
    approvalRequired: Boolean(spec.approvalRequired),
    entrypoint: `tools/generated/${safe}/adapter.mjs`
  };
  return {
    manifest,
    files: {
      [`tools/generated/${safe}/adapter.mjs`]: `export async function run(input, context = {}) {\n  throw new Error(${JSON.stringify(`Adapter ${safe} is not implemented; provider boundary is explicit.`)});\n}\n`,
      [`tools/generated/${safe}/self-test.mjs`]: `import assert from 'node:assert/strict';\nimport { run } from './adapter.mjs';\nassert.equal(typeof run, 'function');\nconsole.log(${JSON.stringify(`${safe}: factory scaffold PASS`)});\n`,
      [`tools/generated/${safe}/EVIDENCE.md`]: `# ${safe}\n\nStatus: scaffolded, not admitted.\n\nReason: the provider adapter must be implemented and independently tested before promotion.\n`
    }
  };
}
