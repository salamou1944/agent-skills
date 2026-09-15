---
name: revenue-path-validator
description: Converts an online-income idea into a falsifiable execution path from source/skill to buyer, conversion, payout, and bank-usable funds.
---
# Revenue Path Validator

For every revenue opportunity, prove these links in order:

`source -> eligibility -> action -> deliverable -> buyer/conversion -> approval -> payout -> withdrawal -> usable funds`

## Evidence levels
- `Verified`: directly checked against current source.
- `User-confirmed`: supplied/confirmed by the user.
- `Inferred`: logically derived but not independently confirmed.
- `Planned`: intended, not executed.
- `Implemented`: code/workflow exists.
- `Failed`: attempted and failed.
- `Unknown`: required evidence missing.

## Kill conditions
Discard or quarantine paths with:
- guaranteed-income claims without evidence;
- unclear payout route;
- geographic ineligibility;
- required upfront payment that defeats the zero-cost objective;
- policy violations, spam, fraud, fake engagement, or credential abuse.

## Output
Give the exact next executable action and the evidence still missing. Never state that money reached a bank account unless the transaction is actually verified.
