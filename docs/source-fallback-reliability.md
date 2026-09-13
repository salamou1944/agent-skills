# Source / Fallback Reliability

This layer provides a provider-neutral reliability boundary for any operation that can be served by more than one source.

## Contract

A source has:

- `id` — stable identifier used for health and telemetry.
- `priority` — lower values are preferred.
- `fetch(context)` — retrieves a candidate value. The context includes an `AbortSignal`.

The router owns:

1. source ordering;
2. bounded timeout;
3. retry policy;
4. fallback activation;
5. common validation;
6. source health/cooldown;
7. structured failure evidence.

## Reliability path

```text
Request
  ↓
Eligible sources
  ↓
Primary
  ↓ failure/timeout/invalid
Retry primary
  ↓ exhausted
Fallback
  ↓ failure/timeout/invalid
Retry fallback
  ↓
Validated result OR structured ReliabilityError
```

## Security boundary

Fallback is **not** a trust bypass. Every source, including the fallback, passes the same validator before its value can be returned.

The report records source identifiers and sanitized error messages only. Provider payloads, credentials and arbitrary response bodies must not be copied into telemetry.

## Health behavior

A source accumulates consecutive failures. After the configured threshold it enters cooldown. During cooldown it is skipped for normal requests. If every source is cooling down, the highest-priority source receives one controlled recovery probe rather than the router becoming permanently unavailable.

A successful request resets the source health state.

## Retry vs fallback

Retries happen within the current source before moving to the next source. This prevents a transient primary failure from causing unnecessary provider switching.

## Integration example

```js
import { ReliableSourceRouter } from './lib/source-fallback-reliability.mjs';

const router = new ReliableSourceRouter({
  sources: [primaryProvider, secondaryProvider],
  timeoutMs: 5000,
  maxAttemptsPerSource: 2,
  validate: (value) => value?.ok === true,
});

const result = await router.execute({
  operation: 'capability-discovery',
  metadata: { requestType: 'engineering' },
});
```

The implementation is intentionally independent of a specific API, MCP server, Skill or provider. This lets the engineering system attach reliability to discovery, resolution, generation, deployment and other provider-backed operations without coupling the core to one vendor.
