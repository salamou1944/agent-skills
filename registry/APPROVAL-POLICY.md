# Approved Skills Registry

This repository is the controlled skill layer for our agent workflow.

## Policy
- External skills are **candidates**, never trusted by default.
- Every imported skill must pass source review, prompt-injection review, script review, license review, scope review, and functional validation.
- Prefer small, focused skills and progressive disclosure.
- Never grant blanket tool access. Skills must state required tools and side effects.
- Security, testing, production-readiness, and customer-impacting changes require evidence.

## Priority tracks
1. Security and trust
2. API testing and production readiness
3. Code/GitHub engineering
4. Product and research
5. Customer/lead operations
6. Meta-skills for creating and evaluating skills

## External source pools
- OpenAI Codex skills
- VoltAgent awesome-agent-skills
- Antigravity awesome skills
- Alirezarezvani claude-skills
- Tech Leads Club agent-skills
- Composio Codex skills

External repositories are reference pools only. Do not bulk-install them.

## Approval states
- CANDIDATE: discovered, not trusted
- REVIEW: under security/quality review
- APPROVED: passed review and tests
- ADAPTED: rewritten into our own focused implementation
- BLOCKED: unsafe, redundant, unmaintained, or unsuitable

## Required record
Each candidate should record: source, path, purpose, risk, license, dependencies, required tools, side effects, test evidence, and decision.
