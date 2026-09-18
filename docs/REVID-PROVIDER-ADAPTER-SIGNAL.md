# Revid Provider Adapter Signal

Revid is now recorded as an agent-native short-form video provider candidate.

Verified current capabilities:
- Public REST API v3 with workflow-based rendering.
- Remote MCP server with rendering, status, export, publishing and credit-estimation tools.
- CLI with structured JSON output and async render/status/export operations.
- Workflows include script-to-video, prompt-to-video, article-to-video, audio-to-video, avatar-to-video, caption-video and ad generation.
- Social publishing can target TikTok, YouTube and Instagram, with scheduling support.

MONY integration rule:
Use Revid through the provider abstraction rather than coupling MONY directly to it. Store provider, workflow, cost estimate, render ID, artifact URL, validation result and publish evidence.

Failure handling:
- insufficient credits → do not bypass limits; route to another configured provider or BLOCKED.
- source scraping failure/403 → use an authorized alternative source path or BLOCKED.
- render failure/timeout → retry according to provider policy, then fallback.

Credential rule:
No Revid API key or OAuth credential is stored in the repository. Live activation requires runtime-managed credentials.

Source: Revid official API/MCP documentation checked September 2026.