---
name: ai-tool-directory-intelligence
description: Use large AI-tool directories such as AIxploria as discovery sources for MONY and Elite. Convert directory listings into verified capability signals, candidate providers, workflow components, and experiments without treating directory presence, ratings, or free labels as proof of quality, API access, reliability, licensing, or revenue potential.
---

# AI Tool Directory Intelligence

## Purpose

Treat AI tool directories as **discovery sensors**, not authorities.

Primary contract:

`discover → normalize → verify → capability-map → experiment → integrate → measure → retire`

## Source handling

When a directory such as AIxploria is available:

1. Record source URL, retrieval date, category, tool name, description, and directory status.
2. Normalize each candidate into capability dimensions:
   - task/output
   - input modalities
   - automation/API availability
   - integration surface
   - free/freemium/paid/trial
   - limits/credits
   - latency/batch behavior
   - export/editability
   - provenance/rights requirements
   - reliability evidence
   - geographic or account constraints
3. Never infer API access, commercial rights, quality, uptime, or revenue from a directory listing alone.
4. Verify important claims on the provider's own documentation/site before production use.
5. Prefer tools that expose stable APIs, webhooks, SDKs, exportable artifacts, or reproducible workflows when automation is the objective.
6. Keep multiple providers for critical capabilities; directory discovery must not create vendor lock-in.

## Candidate scoring

Do not use a single subjective "best tool" score. Track measurable fields instead:

- capability fit
- verification status
- automation surface
- artifact quality
- reproducibility
- cost per accepted artifact
- latency
- failure rate
- rate-limit behavior
- licensing/rights status
- fallback availability

A candidate can only become a production provider after task-specific evidence exists.

## MONY integration

Use directory intelligence upstream of:

`discover → verify → route → package → publish → measure`

Directory findings may generate:
- new provider adapters
- provider fallback candidates
- new revenue workflows
- content/video/image/design production routes
- affiliate opportunities

Revenue is never inferred from tool popularity or directory placement. Only provider-confirmed attribution counts.

## Elite / ARMY-14 integration

Use the same intelligence to discover:
- coding/research/documentation tools
- agent frameworks
- browser/automation capabilities
- multimodal utilities
- evaluation and observability tools
- developer infrastructure

Before integrating, test in a deterministic fixture where possible and preserve evidence.

## Free-tool handling

"Free" is a discovery attribute, not a reliability guarantee.

Track:
- anonymous vs account-required
- daily/monthly limits
- credits
- commercial-use terms
- API availability
- watermark/export restrictions
- data-use/privacy constraints

Prefer reproducible free/open alternatives when they meet the same acceptance criteria.

## Retirement

Retire or downgrade a provider when:
- verification becomes stale,
- acceptance quality drops,
- limits make it uneconomic,
- rights become unsuitable,
- reliability falls below the workflow threshold,
- a verified replacement performs better on the same measurable task.

Never delete historical evidence; mark the provider status and preserve the experiment record.
