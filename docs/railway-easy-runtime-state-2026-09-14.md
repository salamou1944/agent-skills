# EASY Developer Platform — Railway State

Date: 2026-09-14

## Source of truth
- GitHub repository: `salamou1944/agent-skills`
- Branch: `main`
- Repository is the source of truth; do not depend on Replit for the production architecture.

## Railway production
- Project: `EASY Developer Platform`
- Project ID: `778678c6-dd6e-40fe-a33e-63d0953ab7d4`
- Environment: `production`
- Environment ID: `ae3d2189-2aa5-4c5e-8ee8-9bfdc45dc2a4`
- Primary service: `easy-platform-runtime-v3`
- Service ID: `721280c9-8045-4bcb-a932-3455866bae2b`
- Public domain: `easy-platform-runtime-v3-production.up.railway.app`

## Customer persistence objective
Customer account records must persist across deployments/restarts using a Railway Volume mounted at `/app/data`.
The application variable is:
`EASY_CUSTOMER_STATE_FILE=/app/data/easy-customers.json`

## Volume conflict that occurred
Railway rejected a staged configuration because service v3 would have two volumes attached:
1. Desired volume: `2484778c-5683-4150-bcc2-f33e0b7e5f1a` mounted at `/app/data`
2. Legacy/undesired volume: `6bd4d51f-923b-43b3-a80c-74720342786a` mounted at `/data`

A Railway service can only have one Volume. The correct target is to keep `2484778c-5683-4150-bcc2-f33e0b7e5f1a` at `/app/data` and remove the `/data` volume.

The user manually removed the `/data` volume and cancelled an unrelated proposed deletion of `easy-platform-runtime-v2`.

## Current Railway observation
Latest status check after the user's removal:
- staged patch still exists: `74ddb8e0-7f45-4908-b754-3a1844e6db30`
- patch status: `STAGED`
- changeCount: `1`
- v3 latest deployment: `391e2467-8e38-40e2-aa0c-6c46d60f31e8`
- v3 latest deployment status: `FAILED`
- live service status had reported no attached volumes, so persistence is NOT yet proven.

The user saw a Railway confirmation screen proposing deletion of `easy-platform-runtime-v2`. This must NOT be committed as part of the persistence fix. v2 should remain unless a separate explicit cleanup decision is made.

## Runtime architecture relevant to persistence
- `apps/easy-developer-platform/customer-auth.mjs`: customer registration/login/me/dashboard; passwords use scrypt; customer state path configurable.
- `apps/easy-developer-platform/railway-volume-bootstrap.mjs`: intended bootstrap for Railway volume creation/cleanup.
- `apps/easy-developer-platform/runtime.mjs`: starts platform/operator/creative/customer services and runs E2E boot smoke.
- v3 pre-deploy command currently: `node apps/easy-developer-platform/railway-volume-bootstrap.mjs`

## Required proof before declaring complete
1. v3 has exactly one live Volume at `/app/data`.
2. Deployment succeeds.
3. `/api/customer/health` succeeds.
4. A test customer can register and login.
5. Customer state is actually written under `/app/data/easy-customers.json`.
6. After a restart/redeploy, the same test customer can still authenticate, proving persistence.
7. No claim of completion until these checks are verified.

## Important safety rule
Do not commit a change that deletes `easy-platform-runtime-v2` merely to resolve the Volume problem. Do not claim the Volume is working based only on a staged configuration; verify the live service configuration and runtime behavior.
