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