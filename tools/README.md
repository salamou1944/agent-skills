# Tool Intelligence Registry

This directory is the controlled intake layer for high-value agent tools.

## Selection policy

A tool is admitted only after checking:

1. Provenance: official vendor/project source or a clearly attributable upstream.
2. Maintenance: recent activity, release/version evidence, and issue health.
3. Security: permissions, secret handling, sandbox boundaries, and supply-chain risk.
4. Capability: concrete value to our agent stack.
5. Testability: deterministic smoke/integration tests are possible.
6. Failure behavior: timeouts, retries, validation, and fail-closed behavior are understood.
7. License: compatible with intended use.

We do not blindly copy or trust community tools. Reference implementations are inspected and adapted only when their security and production fit are acceptable.

## Initial priority classes

- P0: execution, filesystem, Git, web/fetch, search, memory, time, validation, sandbox.
- P1: databases, browser/computer automation, observability, messaging, cloud/devops.
- P2: specialized domain integrations.

## Important distinction

A source can be authoritative without being production-ready. For example, the official MCP reference-server repository explicitly describes its servers as educational/reference implementations, so they must pass our own security and reliability gate before adoption.

## Tool lifecycle

`discover -> score -> inspect -> adapt -> self-test -> integration-test -> promote -> monitor -> retire`

The registry records both accepted tools and rejected/deferred candidates so future work does not repeat the same research.
