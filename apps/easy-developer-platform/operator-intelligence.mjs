import { plan as deterministicPlan } from './ai-operator.mjs';

function config(env=process.env) {
  return { endpoint: env.EASY_OPERATOR_LLM_ENDPOINT || '', model: env.EASY_OPERATOR_LLM_MODEL || '', apiKey: env.EASY_OPERATOR_LLM_API_KEY || '' };
}

export function intelligenceStatus(env=process.env) {
  const cfg=config(env);
  return { providerConfigured:Boolean(cfg.endpoint && cfg.model && cfg.apiKey), provider:cfg.endpoint ? 'openai-compatible' : null, execution:'fail-closed-until-provider-verified' };
}

export async function planWithIntelligence(goal, { fetchImpl=globalThis.fetch, env=process.env, timeoutMs=15000 }={}) {
  const deterministic=deterministicPlan(goal);
  const cfg=config(env);
  if (!cfg.endpoint || !cfg.model || !cfg.apiKey) return { ...deterministic, intelligence:{status:'UNAVAILABLE',reason:'llm_provider_not_configured'} };
  if (typeof fetchImpl !== 'function') return { ...deterministic, intelligence:{status:'FAILED',reason:'fetch_unavailable'} };
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetchImpl(cfg.endpoint,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${cfg.apiKey}`},body:JSON.stringify({model:cfg.model,messages:[{role:'system',content:'Return JSON only. Create a concise execution plan. Never request bypassing authorization or secrets.'},{role:'user',content:goal}],temperature:0}),signal:controller.signal});
    if (!response.ok) return { ...deterministic, intelligence:{status:'FAILED',reason:`provider_http_${response.status}`} };
    const body=await response.json();
    const text=body?.choices?.[0]?.message?.content;
    if (typeof text!=='string' || !text.trim()) return { ...deterministic, intelligence:{status:'FAILED',reason:'provider_empty_plan'} };
    let parsed; try { parsed=JSON.parse(text); } catch { return { ...deterministic, intelligence:{status:'FAILED',reason:'provider_non_json_plan'} }; }
    return { ...deterministic, intelligence:{status:'VERIFIED',provider:'openai-compatible',model:cfg.model}, modelPlan:parsed };
  } catch (error) {
    return { ...deterministic, intelligence:{status:'FAILED',reason:error.name==='AbortError'?'provider_timeout':error.message} };
  } finally { clearTimeout(timer); }
}
