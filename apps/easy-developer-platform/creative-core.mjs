import crypto from 'node:crypto';

export const PRODUCT_DNA_VERSION = '0.1.0';
export const IMMUTABLE_FIELDS = Object.freeze([
  'brandName', 'printedText', 'logo', 'color', 'shape', 'components', 'designDetails', 'material'
]);
export const FLEXIBLE_FIELDS = Object.freeze([
  'background', 'environment', 'lighting', 'camera', 'composition', 'objects', 'effects', 'context'
]);

const clean = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : null;
const list = (value, max = 32) => Array.isArray(value) ? value.map(v => clean(v, 120)).filter(Boolean).slice(0, max) : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  return JSON.stringify(value ?? null);
}

export function fingerprint(value) {
  return crypto.createHash('sha256').update(stable(value)).digest('hex');
}

export function createProductDNA(input = {}) {
  const asset = object(input.asset);
  const observations = object(input.observations);
  const dna = {
    version: PRODUCT_DNA_VERSION,
    source: {
      assetId: clean(input.assetId, 120),
      mimeType: clean(asset.mimeType, 120),
      fileName: clean(asset.fileName, 240),
      width: Number.isFinite(asset.width) ? asset.width : null,
      height: Number.isFinite(asset.height) ? asset.height : null,
      bytes: Number.isFinite(asset.bytes) ? asset.bytes : null,
      sha256: clean(asset.sha256, 128),
    },
    identity: {
      category: clean(observations.category, 120),
      type: clean(observations.type, 120),
      description: clean(observations.description, 600),
    },
    immutable: {
      brandName: clean(observations.brandName, 160),
      printedText: list(observations.printedText),
      logo: clean(observations.logo, 300),
      color: list(observations.color, 12),
      shape: clean(observations.shape, 200),
      components: list(observations.components),
      designDetails: list(observations.designDetails),
      material: list(observations.material, 12),
    },
    flexible: {
      background: clean(observations.background, 200),
      environment: clean(observations.environment, 200),
      lighting: clean(observations.lighting, 200),
      camera: clean(observations.camera, 200),
      composition: clean(observations.composition, 200),
      objects: list(observations.objects),
      effects: list(observations.effects),
      context: clean(observations.context, 300),
    },
    provenance: {
      extraction: input.extraction || 'declared-observation',
      provider: clean(input.provider, 120),
      verified: input.verified === true,
    },
  };
  dna.fingerprint = fingerprint(dna);
  return dna;
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim().toLowerCase()).sort();
  if (typeof value === 'string') return value.trim().toLowerCase();
  return value ?? null;
}

export function checkProductIntegrity(sourceDNA, candidate = {}) {
  const source = object(sourceDNA.immutable);
  const target = object(candidate.immutable || candidate);
  const mismatches = [];
  for (const field of IMMUTABLE_FIELDS) {
    const expected = comparable(source[field]);
    const actual = comparable(target[field]);
    if (expected === null || expected === undefined) continue;
    if (stable(expected) !== stable(actual)) mismatches.push({ field, expected, actual });
  }
  return {
    version: PRODUCT_DNA_VERSION,
    decision: mismatches.length ? 'BLOCK' : 'PASS',
    immutableChecked: IMMUTABLE_FIELDS.filter(field => source[field] !== null && source[field] !== undefined),
    mismatches,
    reason: mismatches.length ? 'immutable-product-change-detected' : 'immutable-product-integrity-preserved',
    checkedAt: new Date().toISOString(),
  };
}

export function compileCreativeInstruction(dna, request = {}) {
  if (!dna?.fingerprint) throw new Error('product_dna_required');
  const direction = clean(request.direction, 800) || 'Create a premium, realistic commercial presentation of the exact product.';
  const instruction = {
    version: '0.1.0',
    mode: 'provider-neutral',
    productDNA: dna.fingerprint,
    objective: direction,
    immutable: Object.fromEntries(IMMUTABLE_FIELDS.map(field => [field, dna.immutable?.[field] ?? null])),
    flexible: Object.fromEntries(FLEXIBLE_FIELDS.map(field => [field, request[field] ?? dna.flexible?.[field] ?? null])),
    hardRules: [
      'Do not alter product color.',
      'Do not alter logo or printed text.',
      'Do not invent product components or claims.',
      'Do not change product shape or proportions.',
      'Preserve all observed design details.',
      'If a requested change conflicts with immutable product DNA, reject the change.',
    ],
    output: {
      generationEnabled: false,
      provider: null,
      requiredValidation: 'product-integrity-before-delivery',
    },
  };
  return { instruction, fingerprint: fingerprint(instruction) };
}

export function validateCreativeOutput(dna, output = {}) {
  const integrity = checkProductIntegrity(dna, output);
  const claims = list(output.claims);
  const inventedClaims = claims.filter(c => !/^(observed|provided|verified):/i.test(c));
  return {
    ...integrity,
    decision: integrity.decision === 'PASS' && inventedClaims.length === 0 ? 'PASS' : 'BLOCK',
    inventedClaims,
    reason: inventedClaims.length ? 'unverified-claims-detected' : integrity.reason,
  };
}

export function providerStatus() {
  return {
    status: 'DISABLED',
    provider: null,
    generationEnabled: false,
    reason: 'external-generation-provider-not-selected',
    contract: ['analyzeAsset', 'generateCreative', 'validateOutput'],
  };
}
