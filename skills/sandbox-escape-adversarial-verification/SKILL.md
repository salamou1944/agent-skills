---
name: sandbox-escape-adversarial-verification
description: Evaluate microVM and AI-coding-agent sandbox boundaries against host-escape classes, shared-workspace risks, MCP trust boundaries, network policy, and symlink/race conditions. Use only for authorized defensive validation and controlled fixtures.
---

# Sandbox Escape Adversarial Verification

## Purpose

Treat sandboxing as a security boundary that requires continuous verification, not a permanent guarantee.

Current Docker Sandboxes guidance uses microVM isolation plus network, Docker Engine, workspace, and credential layers. Recent security fixes demonstrate that host-side filesystem and socket mediation can still contain exploitable race/symlink classes.

## Verification contract

`inventory → threat-model → version-check → isolated fixture → adversarial probe → host-boundary assertion → regression test → evidence`

## Required checks

### 1. Version and advisory gate
- Identify the exact sandbox/runtime version.
- Check the vendor security advisories before executing untrusted workloads.
- Fail closed for versions affected by known escape vulnerabilities.

### 2. Trust-boundary inventory
Record:
- host mounts/workspaces
- clone vs direct mode
- network policy
- host services reachable through proxies
- MCP servers and whether they run on host or remotely
- credential injection paths
- device/GPU passthrough
- sockets and IPC bridges
- shared skills/configuration directories

### 3. Boundary tests
Use only a local fixture or explicitly authorized lab.

Test categories:
- symlink and TOCTOU handling around shared paths
- unauthorized host-file access
- unauthorized Unix-socket access
- host process/daemon reachability
- network policy escape
- credential disclosure
- MCP privilege crossing
- workspace boundary violations

Do not turn these categories into attack instructions for third-party systems. The objective is to prove or disprove the boundary in a controlled environment.

### 4. Regression evidence

For every boundary:
- expected denial
- observed result
- runtime version
- fixture identifier
- logs/evidence
- regression test reference

A sandbox test passes only when the forbidden operation is demonstrably blocked and the result is reproducible.

## Docker-specific lessons

Docker disclosed two Docker Sandboxes vulnerabilities fixed in 0.42.0 on September 7, 2026:
- CVE-2026-77179: a macOS virtio-fs host-server symlink issue could allow a malicious guest to escape a shared workspace and read/modify host files.
- CVE-2026-79994: a guest-to-host Unix-socket relay path-check/reconnect race could redirect the host to an unauthorized AF_UNIX socket.

Affected ranges and platform scope must always be taken from the current Docker advisory rather than copied from this skill forever.

If updating is not possible, Docker recommends clone mode and avoiding read-write host mounts for the affected versions.

## AI-agent-specific lesson

Docker's current security model states that local stdio MCP servers run on the host and remote MCP servers run outside the sandbox. MCP therefore represents an explicit trust boundary and must be included in the threat model.

Direct workspace mode is also a boundary exception: the agent can modify the host working tree by design. Clone or mountless modes should be preferred for untrusted-code experiments when the workflow permits.

## Elite integration

Before Elite executes untrusted or externally sourced code:
1. Resolve sandbox/runtime version.
2. Apply advisory gate.
3. Prefer isolated/mountless or clone mode.
4. Minimize MCP and host-service exposure.
5. Run deterministic boundary probes.
6. Record evidence.
7. Refuse execution when a known boundary vulnerability or missing acceptance evidence exists.

This is a security precondition, not a post-hoc audit.

## Status

- PASS: patched runtime + expected isolation + boundary tests pass.
- BLOCKED: required isolation/version/evidence cannot be established.
- FAIL: an authorized boundary test demonstrates an isolation violation.
