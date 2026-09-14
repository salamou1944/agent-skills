# Recovery Runbook — EASY Railway v3

## Goal
Recover persistent customer storage for `easy-platform-runtime-v3` without deleting the v2 service.

## Target
Project `778678c6-dd6e-40fe-a33e-63d0953ab7d4`, production environment `ae3d2189-2aa5-4c5e-8ee8-9bfdc45dc2a4`, service `721280c9-8045-4bcb-a932-3455866bae2b`.

## Volume invariant
Exactly one volume on v3, mounted at `/app/data`.
Desired volume ID: `2484778c-5683-4150-bcc2-f33e0b7e5f1a`.
Undesired legacy volume ID: `6bd4d51f-923b-43b3-a80c-74720342786a` at `/data`.

## Current staged state
Patch `74ddb8e0-7f45-4908-b754-3a1844e6db30` was observed as STAGED with one change. A UI confirmation proposing deletion of `easy-platform-runtime-v2` was explicitly rejected; never use that deletion as the persistence fix.

## Verification sequence
- Inspect live v3 configuration and confirm exactly one volume at `/app/data`.
- Apply only the intended v3 persistence change.
- Verify successful deployment.
- Verify customer health and registration/login.
- Verify customer state exists on `/app/data/easy-customers.json`.
- Restart/redeploy v3 and verify the same test customer remains available.

## Non-negotiable
Do not declare persistence complete until the live volume and restart persistence are both proven.
