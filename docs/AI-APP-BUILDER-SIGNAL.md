# AI App Builder Signal — GetAIBuild

## Decision
KEEP as a capability signal; do not make GetAIBuild a runtime dependency.

GetAIBuild currently advertises prompt-to-app generation, iterative project history, unlimited projects/prompts, React/TypeScript/Tailwind output, publishing, analytics, and authentication/database hooks. These are vendor claims and should be benchmarked rather than assumed.

## Engineering patterns to extract
- Prompt -> complete application plan rather than isolated component generation.
- Persistent project state across iterative prompts.
- Project Wizard that turns a short idea into a structured build specification.
- File/reference attachments as first-class project context.
- Explicit separation between publishable output and generation workflow.
- Production gates around auth, data, analytics, responsive behavior and deployment.

## Stronger reference for our architecture
An open-source related implementation, totalumlabs/ai-app-builder-open, is MIT licensed and exposes a useful architecture pattern: live preview, code editor, sandbox, database/auth hooks, GitHub bidirectional sync, version history, logs, isolated projects and diff review. It depends on an external VCaaS API, so we treat it as a study/benchmark source, not as an assumed dependency.

## Integration targets
### Elite / ARMY-14
Use a Project Build Contract:
intent -> requirements -> architecture -> files -> implementation -> diff -> build -> test -> deploy evidence.

Agents should preserve project history and produce reversible checkpoints rather than treating each prompt as a destructive regeneration.

### EASY
Use the same structured-project approach for seller/storefront generation, while Product DNA and Product Integrity remain hard constraints.

### MONY
Use it for rapid campaign landing pages and offer microsites, with tracking configuration protected and verified before publication.

## Verification requirements
Benchmark generated projects for:
- build success
- runtime errors
- dependency health
- auth/data isolation
- secret handling
- responsive behavior
- accessibility
- SEO
- analytics/tracking correctness
- diff locality
- rollback/reproducibility
- cost and latency

Never treat a vendor's free/unlimited claim as proof of reliability or sustainability.

## References
- https://getaibuild.com/
- https://getaibuild.com/pricing
- https://getaibuild.com/wizard
- https://github.com/totalumlabs/ai-app-builder-open
- https://github.com/Etiip/ai-app-builder