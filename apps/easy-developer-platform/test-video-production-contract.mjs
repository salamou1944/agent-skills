import assert from "node:assert/strict";
import test from "node:test";
import { normalizeVideoRequest, validateVideoArtifact } from "./video-production-contract.mjs";

test("video request normalization is deterministic", () => {
  const a = normalizeVideoRequest({ mode: "IMAGE-TO-VIDEO", prompt: "product hero", durationSeconds: 5, width: 1280, height: 720, provider: "ltx" });
  assert.deepEqual(a, { mode: "image-to-video", prompt: "product hero", referenceAsset: null, durationSeconds: 5, width: 1280, height: 720, provider: "ltx" });
});

test("invalid video mode and dimensions fail closed", () => {
  assert.throws(() => normalizeVideoRequest({ mode: "video-to-video", durationSeconds: 5, width: 1280, height: 720 }), /unsupported_video_mode/);
  assert.throws(() => normalizeVideoRequest({ mode: "text-to-video", durationSeconds: 5, width: 0, height: 720 }), /invalid_dimensions/);
});

test("artifact validation distinguishes valid and corrupt output", () => {
  assert.deepEqual(validateVideoArtifact({ path: "out.mp4", codec: "h264", durationSeconds: 5, width: 1280, height: 720 }), { ok: true, errors: [] });
  assert.deepEqual(validateVideoArtifact({ path: "out.mp4", codec: "h264", durationSeconds: 5, width: 1280, height: 720, corrupt: true }), { ok: false, errors: ["corrupt_artifact"] });
});
