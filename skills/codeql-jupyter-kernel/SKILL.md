---
name: codeql-jupyter-kernel
description: Use a Jupyter kernel for interactive CodeQL exploration, notebook-driven analysis, and reproducible security research with CodeQL.
license: MIT
---

# CodeQL Jupyter Kernel

Use this skill when interactive notebook-based CodeQL analysis is useful.

## Procedure
1. Verify Python/Jupyter dependencies and register the CodeQL kernel.
2. Verify that a compatible CodeQL CLI is available before attempting query execution.
3. Start with a minimal notebook/kernel smoke test.
4. For real analysis, bind the kernel to an explicit CodeQL database and record its provenance.
5. Keep query execution reproducible: capture query path, database path, CodeQL version, and result artifact.
6. Do not call kernel registration proof a successful CodeQL query execution; those are separate evidence levels.

## Safety
Treat CodeQL databases and query results as potentially sensitive security artifacts.
