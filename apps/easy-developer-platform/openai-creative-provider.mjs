import { CreativeProviderError, createProviderAdapter } from './creative-orchestrator.mjs';

const API_BASE = String(process.env.EASY_OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const IMAGE_MODEL = String(process.env.EASY_OPENAI_IMAGE_MODEL || 'gpt-image-1');
const configuredVisionModel = String(process.env.EASY_OPENAI_VISION_MODEL || 'gpt-4.1-mini');
const VISION_MODEL = configuredVisionModel === 'gpt-5.6-luna' ? 'gpt-4.1-mini' : configuredVisionModel;
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

function normalizeDataUrl(dataUrl, mime = 'image/png') {
  const value = String(dataUrl || '').trim();
  if (!value) throw new CreativeProviderError('asset_data_url_required', 'asset_bytes_missing');
  if (value.startsWith('data:')) return value;
  return `data:${mime};base64,${value}`;
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
    const code = body?.error?.code || null;
    const detail = code ? `${message} [${code}]` : message;
    throw new CreativeProviderError(detail, `provider_http_${response.status}`);
  }
  return body;
}

const DNA_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    category:{type:'string'}, type:{type:'string'}, description:{type:'string'}, brandName:{type:'string'},
    printedText:{type:'array',items:{type:'string'}}, logo:{type:'string'}, color:{type:'array',items:{type:'string'}},
    shape:{type:'string'}, components:{type:'array',items:{type:'string'}}, designDetails:{type:'array',items:{type:'string'}},
    material:{type:'array',items:{type:'string'}}, background:{type:'string'}, environment:{type:'string'}, lighting:{type:'string'},
    camera:{type:'string'}, composition:{type:'string'}, objects:{type:'array',items:{type:'string'}}, effects:{type:'array',items:{type:'string'}}, context:{type:'string'}
  },
  required:['category','type','description','brandName','printedText','logo','color','shape','components','designDetails','material','background','environment','lighting','camera','composition','objects','effects','context']
};

async function analyzeImage(dataUrl, purpose) {
  requireKey();
  const response = await openai('/responses', {
    method:'POST', headers:{'content-type':'application/json'},
    body:JSON.stringify({
      model:VISION_MODEL, store:false,
      input:[{role:'user',content:[
        {type:'input_text',text:[purpose,'Analyze only what is visibly supported by the image. Never invent a brand, text, logo, color, component, material, or feature.','If an immutable attribute cannot be confidently observed, return an empty string or empty array.','For printed text, transcribe only clearly visible text exactly; do not paraphrase.','For color, list the dominant product colors, not the background colors.','For components, list physical product components that are visibly present.','For designDetails, record distinctive visible construction/design details that must not change.','Return only the requested JSON structure.'].join('\n')},
        {type:'input_image',image_url:normalizeDataUrl(dataUrl),detail:'high'}
      ]}],
      text:{format:{type:'json_schema',name:'product_dna_observation',strict:true,schema:DNA_SCHEMA}}
    })
  });
  const text=response?.output_text||response?.output?.flatMap(item=>item?.content||[]).find(part=>part?.type==='output_text')?.text;
  if(!text) throw new CreativeProviderError('vision_returned_no_observations','provider_invalid_output');
  try{return JSON.parse(text);}catch{throw new CreativeProviderError('vision_returned_invalid_json','provider_invalid_output');}
}

export function openAICreativeProvider() {
  return createProviderAdapter({
    name:`openai:${IMAGE_MODEL}`,
    async analyzeAsset(input={}) {
      const dataUrl=input?.asset?.dataUrl||input.dataUrl;
      if(!dataUrl) throw new CreativeProviderError('source_asset_required','asset_bytes_missing');
      const observations=await analyzeImage(dataUrl,'Extract Product DNA from the source product image. The immutable fields are the product identity, brand name, printed text, logo, color, shape, components, design details, and material.');
      return {observations,source:`openai-vision:${VISION_MODEL}`};
    },
    async generateCreative(instruction,input={}) {
      requireKey();
      const asset=input.asset||{};
      const dataUrl=asset.dataUrl||input.dataUrl;
      if(!dataUrl) throw new CreativeProviderError('source_asset_required','asset_bytes_missing');
      const prompt=[
        'Create a realistic commercial creative using the supplied product image as the source asset.',
        'The product itself is protected. Preserve every immutable product attribute exactly: brand name, printed text, logo, color, shape, components, design details, material and proportions.',
        'Do not redesign, recolor, relabel, reshape, replace, remove, duplicate or invent any product part.',
        'Do not invent claims, labels, features or components.',
        'Only change flexible presentation attributes explicitly present in the instruction: background, environment, lighting, camera, composition, objects, effects and context.',
        'Keep the product realistic and recognizable as the exact source product.',JSON.stringify(instruction)
      ].join('\n');
      const form=new FormData();
      form.append('model',IMAGE_MODEL);
      form.append('prompt',prompt);
      form.append('image',dataUrlToBlob(dataUrl,asset.mimeType||'image/png'),asset.fileName||'product.png');
      form.append('output_format','png');
      const body=await openai('/images/edits',{method:'POST',body:form});
      const item=body?.data?.[0];
      if(!item?.b64_json) throw new CreativeProviderError('provider_returned_no_image','provider_invalid_output');
      const outputDataUrl=`data:image/png;base64,${item.b64_json}`;
      return {assetId:input.assetId||null,immutable:instruction.immutable,claims:[],presentation:instruction.flexible,provider:`openai:${IMAGE_MODEL}`,mimeType:'image/png',base64:item.b64_json,dataUrl:outputDataUrl,revisedPrompt:item.revised_prompt||null,fixture:false};
    },
    async validateOutput(dna,output={}) {
      const dataUrl=output.dataUrl||(output.base64?`data:${output.mimeType||'image/png'};base64,${output.base64}`:null);
      if(!dataUrl) throw new CreativeProviderError('generated_image_required_for_integrity_check','integrity_asset_missing');
      const observed=await analyzeImage(dataUrl,'Perform a strict post-generation Product Integrity inspection. Compare the generated image against the immutable Product DNA supplied below. Detect any visible change to the product itself.');
      const expected=dna?.immutable||{};
      const normalize=value=>Array.isArray(value)?value.map(v=>String(v).trim().toLowerCase()).sort():String(value??'').trim().toLowerCase();
      const mismatches=[];
      for(const field of ['brandName','printedText','logo','color','shape','components','designDetails','material']){
        const source=normalize(expected[field]);
        if(source===''||(Array.isArray(source)&&source.length===0)) continue;
        const actual=normalize(observed[field]);
        if(actual===''||(Array.isArray(actual)&&actual.length===0)||JSON.stringify(source)!==JSON.stringify(actual)) mismatches.push({field,expected:expected[field],actual:observed[field]});
      }
      return {providerIntegrity:true,provider:`openai:${VISION_MODEL}`,decision:mismatches.length?'BLOCK':'PASS',mismatches,observed,reason:mismatches.length?'vision-detected-immutable-change':'vision-confirmed-immutable-product-integrity'};
    }
  });
}

export function openAICreativeProviderStatus() {
  return {status:API_KEY?'READY':'BLOCKED',provider:`openai:${IMAGE_MODEL}`,visionProvider:`openai:${VISION_MODEL}`,generationEnabled:Boolean(API_KEY),integrityEnabled:Boolean(API_KEY),reason:API_KEY?null:'openai_api_key_missing'};
}
