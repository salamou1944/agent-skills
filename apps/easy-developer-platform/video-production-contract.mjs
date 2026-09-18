const MODES = Object.freeze(["text-to-video","image-to-video","audio-to-video"]);

export function normalizeVideoRequest(input = {}) {
  const mode = String(input.mode || "").toLowerCase();
  if (!MODES.includes(mode)) throw new Error("unsupported_video_mode");
  const durationSeconds = Number(input.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("invalid_duration");
  const width = Number(input.width);
  const height = Number(input.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("invalid_dimensions");
  }
  return Object.freeze({
    mode,
    prompt: String(input.prompt || ""),
    referenceAsset: input.referenceAsset || null,
    durationSeconds,
    width,
    height,
    provider: String(input.provider || "auto"),
  });
}

export function validateVideoArtifact(artifact = {}) {
  const errors = [];
  if (!artifact.path) errors.push("missing_path");
  if (!artifact.codec) errors.push("missing_codec");
  if (!Number.isFinite(Number(artifact.durationSeconds)) || Number(artifact.durationSeconds) <= 0) errors.push("invalid_duration");
  if (!Number.isInteger(Number(artifact.width)) || !Number.isInteger(Number(artifact.height))) errors.push("invalid_dimensions");
  if (artifact.corrupt === true) errors.push("corrupt_artifact");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export { MODES };
