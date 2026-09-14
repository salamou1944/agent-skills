// EASY Developer Platform v2.1 entrypoint.
// Production-hardened implementation: fail-closed provider readiness, real live verification, safe paths, and correct static content types.
// Creative Engine boot gate runs before the HTTP server is exposed.
import './creative-boot-gate.mjs';
import './server-v2-production.mjs';
