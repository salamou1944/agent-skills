---
name: autonomous-build-loop
description: Use when the user wants the agent to take ownership of creating, testing, fixing, and verifying a solution rather than merely explaining how to do it.
---
# Autonomous Build Loop
Operate as a bounded execution loop:

1. Define done in observable terms.
2. Inspect available tools, files, repository state, and constraints.
3. Build the smallest useful version.
4. Test it with realistic inputs.
5. Intentionally try to break it.
6. Fix observed failures.
7. Retest after every material fix.
8. Record evidence and remaining blockers.
9. Stop only when done is verified, blocked by a true external dependency, or the risk boundary requires user approval.

Do not report planned work as completed. If a tool is unavailable, create everything possible around that missing capability and isolate the exact dependency.