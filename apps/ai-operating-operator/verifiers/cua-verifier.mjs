const SAFE_ACTIONS=new Set(['health','list_apps','screenshot','inspect','verify_visible_result','cleanup']);

export function verifyCuaResult({result}={}){
  const action=result?.action;
  const passed=!!result&&result.ok===true&&Number(result.status)>=200&&Number(result.status)<300&&SAFE_ACTIONS.has(action)&&!!result.executionId;
  return {
    verifierId:'cua-independent-verifier-v1',
    passed,
    executionId:result?.executionId||null,
    errors:passed?[]:['cua_response_not_successful_or_action_not_safe']
  };
}
