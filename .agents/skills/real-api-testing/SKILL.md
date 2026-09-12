---
name: real-api-testing
description: Test an API with real requests and realistic failure cases. Use when validating an API before a customer trial, release, or production claim.
---
# Real API Testing

Inspect the API contract first. Then test happy paths, invalid inputs, authentication boundaries, authorization boundaries, rate limits, malformed payloads, timeouts, retries, duplicate requests, concurrency where relevant, dependency failures, and representative large inputs.

Prefer real reachable environments when explicitly available. Mark mocks and simulations as such. Capture request shape, response status, latency, error behavior, and reproducible evidence without exposing secrets or personal data.
