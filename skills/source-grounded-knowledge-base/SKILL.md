---
name: source-grounded-knowledge-base
description: Build and operate a trusted domain knowledge base from curated sources with source classification, retrieval, provenance, contradiction handling, freshness, abstention, and evidence-backed answers.
---

# Source-Grounded Knowledge Base

Use this skill when an agent must answer from a controlled collection of trusted sources instead of relying on model memory.

## Contract

`collect → classify → index → retrieve → reconcile → answer → cite → refresh`

## Rules

1. **Curate before answering.** Prefer authoritative, primary, current sources and record why each source was admitted.
2. **Inventory every source.** Track source ID, type, title, publisher/owner, date, URL/path, scope, rights, and freshness status.
3. **Classify information.** Organize sources and extracted facts into domains, topics, subtopics, and claim types.
4. **Retrieve evidence first.** Search the knowledge base before generating an answer. Do not fill missing evidence from model memory when the task requires source-grounded output.
5. **Preserve provenance.** Material claims retain source IDs and precise locators whenever available.
6. **Reconcile conflicts explicitly.** When sources disagree, show the competing claims, dates, scope, and evidence rather than silently merging them.
7. **Separate evidence from synthesis.** Mark statements as directly supported, synthesized, unresolved, or unsupported.
8. **Freshness is part of correctness.** Re-check time-sensitive claims and invalidate stale evidence when appropriate.
9. **Support selective retrieval.** Allow source-level inclusion/exclusion so a user or agent can constrain the evidence set.
10. **Abstain safely.** If the evidence set cannot support a material claim, return unresolved/insufficient-evidence rather than hallucinating.
11. **Make answers auditable.** A reviewer should be able to trace each important statement back to its source.
12. **Refresh continuously.** New high-quality sources should trigger reclassification, contradiction checks, and freshness updates.

## Recommended artifacts

- Source registry
- Topic taxonomy
- Retrieval index
- Evidence/claim ledger
- Contradiction matrix
- Freshness ledger
- Provenance/citation map
- Update queue
- Evaluation set with expected evidence
- Audit trail

## Evaluation

Measure at minimum:

- retrieval recall
- retrieval precision
- evidence coverage
- citation/provenance completeness
- contradiction detection rate
- stale-source detection
- abstention correctness
- wrong-source selection rate
- retrieval latency
- reproducibility of answers against a fixed source snapshot

## Elite / ARMY-14 integration

Use this as the knowledge layer beneath retrieval and verification:

`source registry → retrieval → evidence packet → reasoning → answer/artifact → citation audit`

For technical tasks, the same evidence packet can feed planning, implementation, verification, and documentation.

## MONY integration

Use trusted source collections for market research, provider capability research, offer validation, policy/rights checks, and source-grounded content production.

Generated content is not evidence by itself. A successful generation run does not upgrade an unsupported claim into a supported claim.
