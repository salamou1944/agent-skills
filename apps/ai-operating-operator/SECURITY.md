# Security boundary

The operator is a privileged automation component only inside the permissions explicitly granted to its runtime.

## Never do

- bypass authentication, MFA, CAPTCHA, quotas, RBAC, payment, licensing or provider restrictions
- accept unsigned remote task packets
- print or persist raw credentials
- place secrets in Git, task packets, evidence, or reports
- treat a token's presence as proof of resource access
- allow arbitrary shell commands from a remote task packet
- cross project boundaries implicitly

## Required

- HMAC-signed task packets
- runtime-only secret references
- capability verification before action
- per-project allowlists
- bounded timeouts/retries
- idempotency keys for mutations
- immutable evidence records
- independent verification before VERIFIED
- explicit BLOCKED_PERMISSION / BLOCKED_EXTERNAL_DEPENDENCY states
