export function promotionGateV2({baselineScore=0,candidateScore=0,regressed=0,independent=false,repeats=0,securityFindings=0,harnessStable=false,evidenceArtifact=false}={}){
  const checks={noRegression:regressed===0,netGain:candidateScore>baselineScore,independentEvidence:independent,repeatability:repeats>=2,noNewSecurityFindings:securityFindings===0,harnessStable,evidenceArtifact};
  const eligible=Object.values(checks).every(Boolean);
  return {schema:'army14-evolution-lab/promotion/v2',checks,eligible,decision:eligible?'ELIGIBLE_FOR_FINAL_RELEASE_GATE':'BLOCKED'};
}
