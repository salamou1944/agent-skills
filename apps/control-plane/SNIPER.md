# SNIPER implementation

SNIPER is the first-deviation detector for the existing control plane. It is intentionally a pure analysis layer: it consumes a trusted baseline and observations and returns a deterministic finding.

It currently:
- detects novel signals;
- preserves the first unexplained deviation;
- correlates multiple signal types;
- redacts sensitive fields;
- produces a confidence signal without declaring compromise;
- performs no network access and no counter-intrusion.

Future adapters can feed it authenticated audit events from GitHub, CI/CD, cloud IAM, deployment systems, API gateways, and agent/tool telemetry. Response actions remain outside this detector and must be explicit, least-privileged, auditable, and independently verified.
