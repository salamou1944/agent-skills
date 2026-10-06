---
name: agent-state-backup-recovery
description: Backs up and restores agent memories, knowledge, skills, configuration, and state with private off-site storage, incremental sync, integrity checks, and tested disaster recovery.
---
# Agent State Backup and Recovery

## Procedure
1. Define the recoverable agent state and exclude disposable build artifacts.
2. Separate sensitive configuration and credentials from ordinary knowledge and skill documentation.
3. Require private storage for credential-bearing backups.
4. Perform incremental versioned synchronization with integrity checks.
5. Record backup timestamp, source revision, item count, and sync result.
6. Test restoration into an isolated environment before treating a backup as recoverable.
7. Verify restored memories, skills, configuration, and scheduled state against the backup manifest.
8. Keep backup and recovery evidence separate from production execution evidence.

## Security
Never expose credentials, cookies, tokens, or private configuration through public repositories, logs, generated artifacts, or research output.

## Provenance
Extracted from Collection Agent Vault backup and recovery research. It is a reusable recovery procedure, not an instruction to adopt a specific backup repository.
