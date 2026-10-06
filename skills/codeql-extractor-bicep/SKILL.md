---
name: codeql-extractor-bicep
description: Build and validate the CodeQL extractor for Bicep, resolve the language pack, and run the extractor's CodeQL library and query test suites.
license: MIT
---

# CodeQL Bicep Extractor

Use this skill when CodeQL analysis needs Bicep language extraction.

## Procedure
1. Pin the extractor repository to an auditable commit.
2. Build the Rust extractor with the repository's supported toolchain.
3. Generate the extractor pack and verify CodeQL can resolve the Bicep language.
4. Run the upstream library and query test suites with the generated extractor pack.
5. Record CodeQL version, extractor ref, test suites, and artifacts.
6. Promote only after real build and test evidence; source inspection alone is insufficient.

## Safety
Run extractor builds and tests in isolated CI environments. Treat source-analysis inputs as untrusted.
