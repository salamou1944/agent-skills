#!/usr/bin/env node

import { randomUUID } from 'node:crypto';

/**
 * Provider-neutral source/fallback reliability primitive.
 *
 * Invariants:
 * - sources are ordered by priority;
 * - every accepted value passes the same validation gate;
 * - retries happen before fallback;
 * - timeouts are hard-bounded even when a provider ignores AbortSignal;
 * - unhealthy sources are cooled down, but a controlled recovery probe is possible;
 * - failures never expose source payloads in the report.
 */

export class ReliabilityError extends Error {
  constructor(message, report) {
    super(message);
    this.name = 'ReliabilityError';
    this.report = report;
  }
}

export class SourceHealthRegistry {
  constructor({ failureThreshold = 2, cooldownMs = 30_000, clock = () => Date.now() } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.clock = clock;
    this.states = new Map();
  }

  state(id) {
    return this.states.get(id) || { consecutiveFailures: 0, openUntil: 0 };
  }

  available(id) {
    return this.state(id).openUntil <= this.clock();
  }

  recordSuccess(id) {
    this.states.set(id, { consecutiveFailures: 0, openUntil: 0 });
  }

  recordFailure(id) {
    const previous = this.state(id);
    const consecutiveFailures = previous.consecutiveFailures + 1;
    const openUntil = consecutiveFailures >= this.failureThreshold
      ? this.clock() + this.cooldownMs
      : 0;
    this.states.set(id, { consecutiveFailures, openUntil });
  }

  snapshot() {
    return Object.fromEntries(this.states.entries());
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeError(error) {
  if (error?.kind === 'timeout' || error?.name === 'AbortError') return 'source timeout';
  return error instanceof Error ? error.message : String(error);
}

async function runWithTimeout(source, context, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      const error = new Error('source timeout');
      error.kind = 'timeout';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      source.fetch({ ...context, signal: controller.signal }),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export class ReliableSourceRouter {
  constructor({
    sources,
    validate,
    timeoutMs = 10_000,
    maxAttemptsPerSource = 2,
    backoffMs = 100,
    jitterMs = 25,
    health = new SourceHealthRegistry(),
    sleepFn = sleep,
    random = Math.random,
  }) {
    if (!Array.isArray(sources) || sources.length === 0) {
      throw new TypeError('sources must contain at least one source');
    }
    if (typeof validate !== 'function') throw new TypeError('validate must be a function');
    if (!Number.isInteger(maxAttemptsPerSource) || maxAttemptsPerSource < 1) {
      throw new TypeError('maxAttemptsPerSource must be a positive integer');
    }
    this.sources = [...sources].sort((a, b) => a.priority - b.priority);
    this.validate = validate;
    this.timeoutMs = timeoutMs;
    this.maxAttemptsPerSource = maxAttemptsPerSource;
    this.backoffMs = backoffMs;
    this.jitterMs = jitterMs;
    this.health = health;
    this.sleep = sleepFn;
    this.random = random;
  }

  async execute({ operation, requestId = randomUUID(), metadata = {} }) {
    const report = {
      version: 1,
      requestId,
      operation,
      selectedSource: null,
      fallbackUsed: false,
      attempts: 0,
      failures: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    let eligible = this.sources.filter((source) => this.health.available(source.id));
    if (eligible.length === 0) eligible = [this.sources[0]]; // controlled recovery probe

    for (let sourceIndex = 0; sourceIndex < eligible.length; sourceIndex += 1) {
      const source = eligible[sourceIndex];
      if (sourceIndex > 0) report.fallbackUsed = true;

      for (let attempt = 1; attempt <= this.maxAttemptsPerSource; attempt += 1) {
        report.attempts += 1;
        const context = {
          operation,
          requestId,
          attempt,
          sourceId: source.id,
          metadata,
        };
        const started = Date.now();

        try {
          const value = await runWithTimeout(source, context, this.timeoutMs);
          const valid = await this.validate(value, context);
          if (!valid) {
            const invalid = new Error('source result failed validation');
            invalid.kind = 'invalid';
            throw invalid;
          }

          this.health.recordSuccess(source.id);
          report.selectedSource = source.id;
          report.completedAt = new Date().toISOString();
          return { value, sourceId: source.id, report };
        } catch (error) {
          const kind = error?.kind || (error?.name === 'AbortError' ? 'timeout' : 'error');
          report.failures.push({
            sourceId: source.id,
            attempt,
            kind,
            message: normalizeError(error),
            latencyMs: Date.now() - started,
          });
          this.health.recordFailure(source.id);

          if (attempt < this.maxAttemptsPerSource) {
            const delay = this.backoffMs * (2 ** (attempt - 1)) + Math.floor(this.random() * this.jitterMs);
            await this.sleep(delay);
          }
        }
      }
    }

    report.completedAt = new Date().toISOString();
    throw new ReliabilityError(`All sources failed for operation: ${operation}`, report);
  }
}
