---
name: gh-qldb
description: Manage CodeQL databases from GitHub CLI workflows: create, install, list, inspect, download, and integrate database artifacts into security-analysis pipelines.
license: MIT
---

# gh-qldb

Use this skill when a repository needs repeatable CodeQL database lifecycle management.

## Procedure
1. Verify `gh-qldb` version/ref and GitHub authentication before remote operations.
2. Use the CLI help contract to confirm available database commands.
3. Keep database artifacts associated with explicit repository, language, commit/session, and provenance metadata.
4. Prefer local/list/read operations before create, install, or download mutations.
5. For remote database operations, require an explicit target repository and appropriate authorization.
6. Feed resulting CodeQL databases into CodeQL analysis only after validating provenance and compatibility.
7. Record exact ref, command, result, and blocker; never represent a local CLI smoke test as a remote database proof.

## Safety
CodeQL databases can contain sensitive source-derived information. Restrict access and avoid publishing downloaded databases.
