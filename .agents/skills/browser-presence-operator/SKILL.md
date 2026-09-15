---
name: browser-presence-operator
description: Uses an authorized browser/session to perform website tasks on the user's behalf while preserving security and approval boundaries.
---
# Browser Presence Operator

1. Inspect the target site and current authenticated session.
2. Perform navigation, form filling, uploads, downloads, and verification that the connected browser tool supports.
3. Reuse the existing session rather than requesting credentials again.
4. Stop at CAPTCHA, MFA, device verification, or unsupported access controls rather than bypassing them.
5. Verify the resulting page, receipt, status, or artifact before reporting completion.
