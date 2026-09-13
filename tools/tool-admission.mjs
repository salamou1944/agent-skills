const ALLOWED_RISK = new Set(['low', 'medium']);
const REQUIRED = ['id', 'name', 'capability', 'version', 'source', 'license', 'risk', 'permissions', 'entrypoint'];

export function admitTool(manifest, { requireApprovalFor = ['write', 'delete', 'execute'] } = {}) {
  const errors = [];
  for (const key of REQUIRED) if (manifest?.[key] == null) errors.push(`missing:${key}`);
  if (!ALLOWED_RISK.has(manifest?.risk)) errors.push('risk:not-allowed');
  if (!Array.isArray(manifest?.permissions)) errors.push('permissions:not-array');
  if (!manifest?.source?.url) errors.push('source:url-required');
  if (!manifest?.source?.verified) errors.push('source:not-verified');
  if (!manifest?.license?.spdx) errors.push('license:spdx-required');
  const sensitive = (manifest?.permissions || []).filter((p) => requireApprovalFor.includes(p));
  if (sensitive.length && manifest?.approvalRequired !== true) errors.push('approval:required-for-sensitive-permissions');
  if (manifest?.network?.allowedHosts && !Array.isArray(manifest.network.allowedHosts)) errors.push('network:allowedHosts-not-array');
  return { admitted: errors.length === 0, errors, normalized: errors.length ? null : {
    id: manifest.id, name: manifest.name, version: manifest.version,
    capability: manifest.capability, permissions: [...manifest.permissions].sort(),
    risk: manifest.risk, approvalRequired: Boolean(manifest.approvalRequired), entrypoint: manifest.entrypoint
  }};
}
