export function providerBlocker(error){
  const message=String(error?.message||error||'');
  if(message.startsWith('all_providers_exhausted:'))return {code:'all_providers_exhausted',message};
  const match=message.match(/^provider_(?:http_(408|429|404|410|5\d{2})|timeout|quota_exhausted|unavailable|llm_provider_not_configured)$/);
  if(!match)return null;
  const code=match[1] ? `http_${match[1]}` : message.slice('provider_'.length);
  return {code,message};
}
