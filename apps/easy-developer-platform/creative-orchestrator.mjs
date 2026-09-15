import crypto from 'node:crypto';
import {
  createProductDNA,
  compileCreativeInstruction,
  validateCreativeOutput,
  providerStatus,
} from './creative-core.mjs';

const object = (v) => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const id = () => `creative_${crypto.randomUUID()}`;

export class CreativeProviderError extends Error {
  constructor(message, code = 'provider_error') { super(message); this.code = code; }
}

export function createProviderAdapter(provider, options = {}) {
  const name = options.name || provider?.name || 'anonymous';
  if (!provider || typeof provider.analyzeAsset !== 'function' || typeof provider.generateCreative !== 'function') {
    throw new CreativeProviderError('provider_adapter_contract_invalid', 'provider_contract_invalid');
  }
  return Object.freeze({
    name,
    async analyzeAsset(input) { return provider.analyzeAsset(input); },
    async generateCreative(instruction, input) { return provider.generateCreative(instruction, input); },
    async validateOutput(dna, output) {
      if (typeof provider.validateOutput !== 'function') return null;
      return provider.validateOutput(dna, output);
    },
  });
}

export function fixtureProvider() {
  return createProviderAdapter({
    name: 'deterministic-fixture',
    async analyzeAsset(input) {
      return { observations: object(input.observations), source: 'fixture' };
    },
    async generateCreative(instruction, input) {
      return {
        assetId: input.assetId || null,
        immutable: instruction.immutable,
        claims: [],
        presentation: instruction.flexible,
        provider: 'deterministic-fixture',
        fixture: true,
      };
    },
  });
}

export async function runCreativeJob(input = {}, provider = null) {
  const jobId = input.jobId || id();
  const events = [];
  const mark = (stage, decision, detail = {}) => events.push({ stage, decision, ...detail });
  try {
    if (!provider) {
      mark('provider', 'BLOCK', { reason: providerStatus().reason });
      return { jobId, status: 'BLOCKED', decision: 'BLOCK', reason: 'provider_not_selected', events };
    }
    mark('provider', 'READY', { provider: provider.name });
    const analyzed = await provider.analyzeAsset(input);
    const dna = createProductDNA({
      assetId: input.assetId,
      asset: input.asset,
      observations: analyzed.observations,
      extraction: analyzed.source || 'provider-analysis',
      provider: provider.name,
      verified: true,
    });
    mark('product-dna', 'PASS', { fingerprint: dna.fingerprint, extraction: analyzed.source || 'provider-analysis' });
    const compiled = compileCreativeInstruction(dna, input.request);
    mark('compile', 'PASS', { fingerprint: compiled.fingerprint });
    const output = await provider.generateCreative(compiled.instruction, input);
    mark('generation', 'PASS', { provider: output.provider || provider.name, generatedImage: Boolean(output.dataUrl || output.base64) });

    const coreValidation = validateCreativeOutput(dna, output);
    mark('integrity-core', coreValidation.decision, { mismatches: coreValidation.mismatches, inventedClaims: coreValidation.inventedClaims });
    if (coreValidation.decision !== 'PASS') {
      return { jobId, status: 'BLOCKED', decision: 'BLOCK', reason: coreValidation.reason, dna, instruction: compiled.instruction, output, validation: coreValidation, events };
    }

    const providerValidation = await provider.validateOutput(dna, output);
    if (providerValidation) {
      mark('integrity-vision', providerValidation.decision, { mismatches: providerValidation.mismatches, reason: providerValidation.reason });
      if (providerValidation.decision !== 'PASS') {
        return {
          jobId,
          status: 'BLOCKED',
          decision: 'BLOCK',
          reason: providerValidation.reason,
          dna,
          instruction: compiled.instruction,
          output,
          validation: { core: coreValidation, provider: providerValidation },
          events,
        };
      }
    }

    mark('delivery', 'PASS');
    return {
      jobId,
      status: 'SUCCEEDED',
      decision: 'PASS',
      dna,
      instruction: compiled.instruction,
      output,
      validation: { core: coreValidation, provider: providerValidation },
      events,
    };
  } catch (error) {
    mark('execution', 'FAILED', { error: error.message, code: error.code || 'execution_error' });
    return { jobId, status: 'FAILED', decision: 'BLOCK', reason: error.code || 'execution_error', events };
  }
}
