import { CreativeProviderError, createProviderAdapter } from './creative-orchestrator.mjs';

const API_BASE = String(process.env.EASY_OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const IMAGE_MODEL = String(process.env.EASY_OPENAI_IMAGE_MODEL || 'gpt-image-2');
const API_KEY = String(process.env.EASY_OPENAI_API_KEY || '').trim();

function requireKey() {
  if (!API_KEY) throw new CreativeProviderError('openai_api_key_missing', 'provider_credentials_missing');
}

function dataUrlToBlob(dataUrl, fallbackMime = 'image/png') {
  const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(String(dataUrl || ''));
  if (!match) throw new CreativeProviderError('asset_data_url_required', 'asset_bytes_missing');
  const mime = match[1] || fallbackMime;
  return new Blob([Buffer.from(match[2], 'base64')], { type: mime });
}

async function openai(path, init = {}) {
  requireKey();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${API_KEY}`, ...(init.headers || {}) },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok) {
    const message = body?.error?.message || `openai_http_${response.status}`;
    throw new CreativeProviderError(message, `provider_http_${response.status}`);
  }
  return body;
}

export function openAICreativeProvider() {
  return createProviderAdapter({
    name: `openai:${IMAGE_MODEL}`,
    async analyzeAsset(input = {}) {
      // Product DNA is never invented by this adapter. Until the vision-analysis
      // contract is enabled, caller-supplied observations are required.
      const observations = input.observations;
      if (!observations || typeof observations !== 'object') {
        throw new CreativeProviderError('product_observations_required', 'product_dna_source_missing');
      }
      return { observations, source: 'caller-verified-observations' };
    },
    async generateCreative(instruction, input = {}) {
      requireKey();
      const asset = input.asset || {};
      const dataUrl = asset.dataUrl || input.dataUrl;
      if (!dataUrl) throw new CreativeProviderError('source_asset_required', 'asset_bytes_missing');

      const prompt = [
        'Create a realistic commercial creative using the supplied product image as the source asset.',
        'Preserve every immutable product attribute exactly: brand name, printed text, logo, color, shape, components, design details, material and proportions.',
        'Do not invent claims, labels, features or components.',
        'Only change flexible presentation attributes explicitly present in the instruction.',
        JSON.stringify(instruction),
      ].join('\n');

      const form = new FormData();
      form.append('model', IMAGE_MODEL);
      form.append('prompt', prompt);
      form.append('image', dataUrlToBlob(dataUrl, asset.mimeType || 'image/png'), asset.fileName || 'product.png');
      form.append('response_format', 'b64_json');

      const body = await openai('/images/edits', { method: 'POST', body: form });
      const item = body?.data?.[0];
      if (!item?.b64_json) throw new CreativeProviderError('provider_returned_no_image', 'provider_invalid_output');

      return {
        assetId: input.assetId || null,
        immutable: instruction.immutable,
        claims: [],
        presentation: instruction.flexible,
        provider: `openai:${IMAGE_MODEL}`,
        mimeType: 'image/png',
        base64: item.b64_json,
        revisedPrompt: item.revised_prompt || null,
        fixture: false,
      };
    },
  });
}

export function openAICreativeProviderStatus() {
  return {
    status: API_KEY ? 'READY' : 'BLOCKED',
    provider: `openai:${IMAGE_MODEL}`,
    generationEnabled: Boolean(API_KEY),
    reason: API_KEY ? null : 'openai_api_key_missing',
  };
}
