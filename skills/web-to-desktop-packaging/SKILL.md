---
name: web-to-desktop-packaging
description: Turn web apps or local web builds into lightweight cross-platform desktop artifacts using a Tauri-based packager such as Pake. Use for rapid distribution, isolated desktop shells, and agent-driven packaging; verify licensing, authentication behavior, update strategy, and site compatibility before shipping.
---

# Web-to-Desktop Packaging

## Contract

`input URL/local build → package config → build → artifact verification → runtime smoke test → distribution`

## Why this pattern matters

A Tauri-based web wrapper can package an existing web application for macOS, Windows, and Linux without adopting an Electron/Chromium bundle. Pake is a concrete implementation with a CLI, JSON output mode, declarative configuration, local-build packaging, and an agent-oriented contract.

## Provider facts to verify

The current Pake repository documents:
- one-command CLI packaging;
- macOS, Windows, and Linux support;
- lightweight installers typically under 10 MB;
- customization for shortcuts, windows, drag/drop, styling and related shell behavior;
- `--json` machine-readable output for scripts/agents;
- `--config` declarative app configuration;
- packaging of a local `dist` directory;
- an official `llms.txt` contract for AI-agent usage.

These are provider capabilities, not guarantees for every target website.

## Agent integration

Prefer:

1. Read the provider's current agent/CLI contract before execution.
2. Generate a declarative package specification:
   - source URL or local build
   - app name
   - identifier
   - icon
   - dimensions/window policy
   - navigation/permissions policy
   - platform targets
3. Execute with machine-readable output.
4. Parse stdout deterministically.
5. Inspect build exit status and artifact paths.
6. Launch the produced artifact in a controlled test environment.
7. Verify:
   - app opens;
   - target content loads;
   - authentication behaves as expected;
   - external links/downloads behave as intended;
   - keyboard shortcuts/window behavior;
   - no unexpected privilege or filesystem access;
   - artifact size and metadata;
   - platform-specific signing/notarization requirements where applicable.

## Security and compatibility

A web wrapper is not automatically equivalent to a native app.

Before distribution, check:
- website terms and permission to package/distribute;
- OAuth/SSO redirect compatibility;
- cookie/session persistence;
- CSP and embedded content;
- downloads/uploads;
- deep links;
- WebSocket/WebRTC;
- notifications;
- clipboard;
- file-system access;
- OS keychain/credential behavior;
- auto-update/signing requirements.

Do not bypass website authentication, anti-bot controls, licensing, paywalls, or provider restrictions.

## Elite / ARMY-14

Treat web-to-desktop packaging as a reusable delivery capability:

`build artifact → package → smoke-test → collect evidence → publish/release`

Elite can use it to turn internal web tools into controlled desktop clients for testers without rebuilding the application natively.

Record:
- source revision
- package tool/version
- config hash
- target OS/architecture
- artifact hash
- artifact size
- smoke-test result
- known compatibility limits.

## MONY / EASY

Potential uses include packaging internal dashboards, seller tools, research consoles, creative review interfaces, or operator consoles. Keep the web app as the source of truth; the desktop package is a delivery shell.

## Acceptance

A package is not "done" because the build succeeded.

`BUILD_OK` only proves compilation/package creation.

Use:
- `PASS`: build + artifact integrity + runtime smoke test + required compatibility checks.
- `BLOCKED`: build/runtime cannot be exercised due to missing environment or platform.
- `FAIL`: artifact was produced but an acceptance check failed.
