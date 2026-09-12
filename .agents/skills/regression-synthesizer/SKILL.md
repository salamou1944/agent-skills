---
name: regression-synthesizer
description: Generates targeted regression tests from defects, diffs, incident evidence, and previously observed edge cases.
---
# Regression Synthesizer

Extract the failure invariant, create the smallest reproducible test, add boundary and nearby-path cases, and ensure the test fails before the fix when feasible. Avoid snapshot-only tests that merely encode current output. Return test intent, coverage rationale, and remaining gaps.