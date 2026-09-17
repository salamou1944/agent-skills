# Evidence Contract

Every completion claim must be backed by a machine-readable evidence record.

Required fields:
- `claim`: the capability or task being claimed.
- `status`: `VERIFIED`, `PARTIAL`, or `FAILED`.
- `observed_at`: UTC timestamp.
- `commit_sha`: exact source revision tested.
- `environment`: local/CI/external and relevant runtime version.
- `checks`: named checks with pass/fail status.
- `raw_evidence`: paths, logs, or artifact identifiers; never secrets.
- `limitations`: anything not exercised, including provider credentials or unavailable external systems.

Rules:
1. A workflow existing is not evidence that it passed.
2. A fixture/mock run cannot be represented as live-provider or production evidence.
3. Revenue is never inferred from reachability, an affiliate URL, or a successful synthetic request.
4. Provider-independent gates may prove contracts and orchestration, but not external-provider availability.
5. Evidence must identify the exact commit tested.
