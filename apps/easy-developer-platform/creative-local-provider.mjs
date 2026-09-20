import crypto from 'node:crypto';
import { CreativeProviderError, createProviderAdapter } from './creative-orchestrator.mjs';

function decodeDataUrl(value) {
  const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(String(value || ''));
  if (!match) throw new CreativeProviderError('asset_data_url_required', 'asset_bytes_missing');
  const mimeType = match[1] || 'image/png';
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length) throw new CreativeProviderError('asset_bytes_empty', 'asset_bytes_missing');
  return { mimeType, bytes, base64: bytes.toString('base64') };
}

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function localCreativeProvider() {
  return createProviderAdapter({
    name: 'local-safe-presenter',
    async analyzeAsset(input = {}) {
      const asset = input.asset || {};
      const decoded = decodeDataUrl(asset.dataUrl || input.dataUrl);
      return {
        observations: input.observations || {},
        source: 'local-safe-presenter',
        assetSha256: crypto.createHash('sha256').update(decoded.bytes).digest('hex'),
        mimeType: decoded.mimeType,
        byteLength: decoded.bytes.length,
      };
    },
    async generateCreative(instruction, input = {}) {
      const asset = input.asset || {};
      const decoded = decodeDataUrl(asset.dataUrl || input.dataUrl);
      const sourceSha256 = crypto.createHash('sha256').update(decoded.bytes).digest('hex');
      const image = `data:${decoded.mimeType};base64,${decoded.base64}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="#f4f6f8"/><rect x="70" y="70" width="940" height="940" rx="36" fill="#fff" stroke="#d9dee5" stroke-width="3"/><image href="${image}" x="120" y="120" width="840" height="760" preserveAspectRatio="xMidYMid meet"/><text x="120" y="945" font-family="system-ui,Arial,sans-serif" font-size="28" font-weight="700" fill="#17202a">EASY Safe Creative</text><text x="120" y="982" font-family="system-ui,Arial,sans-serif" font-size="18" fill="#52606d">Source product preserved exactly • Local renderer</text></svg>`;
      return {
        assetId: input.assetId || asset.assetId || null,
        immutable: instruction.immutable,
        claims: [],
        presentation: instruction.flexible,
        provider: 'local-safe-presenter',
        mimeType: 'image/svg+xml',
        dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
        sourceAssetSha256: sourceSha256,
        sourceMimeType: decoded.mimeType,
        sourceByteLength: decoded.bytes.length,
        fixture: false,
        externalProvider: false,
      };
    },
    async validateOutput(dna, output = {}) {
      const expected = String(dna?.source?.sha256 || '').trim().toLowerCase();
      const actual = String(output?.sourceAssetSha256 || '').trim().toLowerCase();
      if (!expected || !actual) {
        return { providerIntegrity: true, provider: 'local-safe-presenter', decision: 'BLOCK', mismatches: [{ field: 'sourceSha256', expected: expected || null, actual: actual || null }], reason: 'source-integrity-hash-missing' };
      }
      const match = expected === actual;
      return {
        providerIntegrity: true,
        provider: 'local-safe-presenter',
        decision: match ? 'PASS' : 'BLOCK',
        mismatches: match ? [] : [{ field: 'sourceSha256', expected, actual }],
        reason: match ? 'source-product-byte-hash-preserved' : 'source-product-byte-hash-changed',
      };
    },
  });
}

export function localCreativeProviderStatus() {
  return { status: 'READY', provider: 'local-safe-presenter', generationEnabled: true, integrityEnabled: true, externalProviderRequired: false, reason: null };
}
