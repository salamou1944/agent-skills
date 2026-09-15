---
name: operating-memory-bridge
description: Synchronizes reusable operating rules, capability registrations, and evidence references with the dedicated AI operating memory repository without moving application code or secrets.
---
# Operating Memory Bridge

1. Read the current operating-memory state before writing.
2. Write only source-of-truth rules, decisions, evidence summaries, capability registrations, and limitations.
3. Keep application implementation in its owning repository.
4. After a memory write, re-read the exact file to verify persistence.
5. When memory and repository state conflict, use the newer verified evidence and record the conflict.
