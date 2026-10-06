import test from 'node:test';
import assert from 'node:assert/strict';
import { runLocalMedia } from './local-media.mjs';
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
test('local media rejects unsupported operation without pretending to execute', async () => { const result = await runLocalMedia({ operation: 'upscaling', dataUrl: png }); assert.equal(result.status, 'LOCAL_CAPABILITY_UNAVAILABLE'); });
test('local media returns explicit evidence or explicit failure', async () => { const result = await runLocalMedia({ operation: 'background_removal', dataUrl: png }); assert.ok(['LOCAL_CAPABILITY_EXECUTED', 'LOCAL_CAPABILITY_FAILED'].includes(result.status)); if (result.status === 'LOCAL_CAPABILITY_EXECUTED') { assert.equal(result.evidence.verifiedFile, true); assert.match(result.dataUrl, /^data:image\/png;base64,/); assert.ok(result.evidence.artifactBytes > 0); } });