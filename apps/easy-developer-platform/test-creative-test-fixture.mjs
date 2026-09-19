import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { createCreativeTestAsset } from './creative-test-fixture.mjs';

const dataUrl = createCreativeTestAsset(1024, 1024);
const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
assert.ok(match, 'fixture must be a PNG data URL');
const png = Buffer.from(match[1], 'base64');
assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

const ihdr = png.subarray(8 + 4 + 4, 8 + 4 + 4 + 13);
assert.equal(ihdr.readUInt32BE(0), 1024);
assert.equal(ihdr.readUInt32BE(4), 1024);
assert.equal(ihdr[8], 8);
assert.equal(ihdr[9], 2);

const idatTypeOffset = 8 + 4 + 4 + 13 + 4 + 4;
assert.equal(png.subarray(idatTypeOffset, idatTypeOffset + 4).toString(), 'IDAT');
const idatLength = png.readUInt32BE(8 + 4 + 4 + 13 + 4);
const idatStart = 8 + 4 + 4 + 13 + 4 + 4 + 4;
const raw = inflateSync(png.subarray(idatStart, idatStart + idatLength));
assert.equal(raw.length, (1 + 1024 * 3) * 1024);
assert.equal(raw[0], 0);
assert.equal(raw[1], 255);
assert.equal(png.subarray(png.length - 12, png.length - 8).toString(), 'IEND');

console.log('creative test fixture passed');
