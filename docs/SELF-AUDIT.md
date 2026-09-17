# System self-audit

Purpose: keep a human-readable marker for cross-layer reliability work. The authoritative implementation remains in the workflows, skills, and tests.

## Required properties
- Provider failure must degrade safely without fabricating progress.
- Autonomous workers must verify before persisting changes.
- Concurrent work must be serialized when it touches the same monorepo state.
- Product and revenue claims require end-to-end evidence, not structural presence alone.
