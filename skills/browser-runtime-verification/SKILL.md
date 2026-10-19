---
name: browser-runtime-verification
description: Verifies web applications in a real browser through critical journeys, observable outcomes, console/network checks, and responsive/accessibility states.
---
# Browser Runtime Verification

## Procedure
1. Start the actual app and verify readiness.
2. Identify the smallest critical user journey.
3. Use semantic/stable locators and exercise real interactions.
4. Verify loading, success, validation, empty, permission, network failure, recovery, refresh, and duplicate-action states as relevant.
5. Inspect browser console and network failures.
6. Verify important backend/persistence side effects.
7. Check responsive and keyboard/accessibility-critical behavior.
8. Re-run after every repair and preserve reproducible evidence.

## Gotchas
Rendering is not completion. A click that produces no verified side effect is a failed journey.

## Browser trust and navigation boundaries
9. Treat navigation as failed when the final URL is blocked by the configured domain allowlist, including after redirects. Do not report success merely because the initial navigation request returned or a page rendered.
10. Before using an existing logged-in browser session, require explicit authorization for that session and the intended actions. Do not export, print, or persist cookies, tokens, or other session secrets as evidence.
11. Keep browser recording and screenshots/video capture off by default when the harness supports that control; enable capture only when explicitly needed and store artifacts in the approved evidence location.
12. Keep agent-generated helpers separate from protected harness/core files. Do not let an agent silently rewrite the harness under test to make its own verification pass.
13. Preserve a minimal reproducible record for redirect/domain failures: starting URL, final URL, policy decision, observed network/console result, and assertion outcome. Redact credentials and private query parameters.
