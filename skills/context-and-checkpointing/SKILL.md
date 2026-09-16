---
name: context-and-checkpointing
description: Manages agent context, checkpoints, resumable work, compact handoffs, and long-running task state without losing critical instructions or evidence.
---
# Context and Checkpointing

## Procedure
1. Keep the task contract and acceptance criteria compact and explicit.
2. Inspect only the files and tool surfaces needed for the current decision.
3. Summarize verified state before context becomes crowded.
4. Checkpoint after meaningful milestones: discovery, implementation, verification, and deployment.
5. Store changed files, test results, blockers, and next action in the checkpoint.
6. Resume from the latest verified checkpoint rather than redoing speculative work.

## Quality bar
Context management must preserve correctness, not merely reduce token use. Never discard a rule, security boundary, acceptance criterion, or failure evidence needed for safe continuation.