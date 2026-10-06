---
name: computer-use-verification
description: Verifies bounded desktop and computer-use actions through observation, scoped authorization, action, independent visible-result verification, and cleanup.
---
# Computer Use Verification

## Procedure
1. Identify the exact desktop/browser surface, task contract, runtime identity, and permission scope.
2. Observe the initial state and capture only task-relevant evidence.
3. Authorize only the minimum action set required by the task.
4. Perform the action through the bounded computer-use adapter.
5. Independently verify the visible result and any required backend side effect.
6. Record screenshots/accessibility state, runtime identity, revision, and verification evidence without collecting secrets.
7. Execute cleanup and verify teardown.
8. Fail closed when authorization, observation, or independent verification is missing.

## Security
Forbidden by default: credential extraction, secret/clipboard harvesting, MFA/CAPTCHA bypass, account takeover, unrestricted host filesystem access, unrestricted network pivot, payment authorization, disabling endpoint security, or persistence outside the sandbox.

## Provenance
Extracted from the verified CUA computer-use Collection research. It defines a verification procedure and does not import a desktop runtime.
