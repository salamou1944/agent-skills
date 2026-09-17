const INTEGRATION_CONTRACT = 'elite-provider-independent-integration-v1';

export function createIntegrationHandoff({ from, to, artifact, stage, goal }) {
  if (!from || !to || !artifact || !stage || !goal) throw new Error('integration_handoff_invalid');
  return Object.freeze({
    contract: INTEGRATION_CONTRACT,
    from,
    to,
    artifact,
    stage,
    goal,
    verified: true,
  });
}

export function verifyIntegrationHandoff(handoff) {
  return Boolean(
    handoff &&
    handoff.contract === INTEGRATION_CONTRACT &&
    handoff.from &&
    handoff.to &&
    handoff.artifact &&
    handoff.stage &&
    handoff.goal &&
    handoff.verified === true,
  );
}

export const integrationContract = INTEGRATION_CONTRACT;
