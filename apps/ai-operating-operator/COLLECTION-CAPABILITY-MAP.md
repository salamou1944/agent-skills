# Collection-to-Operator Capability Map

Generated from the current Project-/COLLECTION index and harvest records. This is an ingestion manifest, not a claim that every source has been fully verified.

## Sources to mine
- aw-junaid: 33 repos
- mufeedvh: 43 repos
- Panniantong: 38 repos
- nmap ecosystem: 7 repos
- Top Five weekly sources
- Agent Reach and all documented collection families
- free/open-source replacement catalogs
- mnfst/awesome-free-llm-apis

## Capability domains
research/search/osint, crawling/extraction, browser automation, documents/OCR, memory/vector retrieval, local AI/inference, model/provider routing, prompt optimization/evaluation, workflow orchestration, queues/durable execution, API/MCP gateways, auth/RBAC/policy, approvals, audit/evidence, observability/APM, security/DevSecOps, secret management, data pipelines/ETL, databases/object storage, analytics/BI, CRM/support, communication/collaboration, email/marketing, forms/e-sign/scheduling, CMS/commerce, media/image/audio/video, backup/DR, developer tooling, CI/CD/PaaS, social automation, networking/zero-trust.

## High-value reference families already captured
Agent-Reach; OpenClaw; Playwright; Browser Use; Writ; WebOperator; WebNav; AgentBrowser; SearXNG; Jina Reader; Firecrawl; Crawl4AI; Scrapy; Docling; OCRmyPDF; Tesseract; Qdrant; rembg; Upscayl; FFmpeg; whisper.cpp; Piper; ComfyUI; LiteLLM; Ollama; llama.cpp; vLLM; LocalAI; Open WebUI; APISIX; STOA; Ferro Labs AI Gateway; Preloop; Hecate; DojoGenesis gateway; SOAT; OGAC; Atlas; n8n; Activepieces; Windmill; Temporal; Airflow; Dagster; Kestra; Huginn; Medusa; Saleor; Vendure; PrestaShop; Chatwoot; Zammad; Twenty; EspoCRM; SuiteCRM; Mautic; Listmonk; Cal.com; Documenso; AppFlowy; AFFiNE; Outline; Wiki.js; BookStack; NocoDB; Baserow; Hoppscotch; Bruno; Yaak; HTTPie; Restfox; Gitea; Forgejo; Coolify; Dokku; CapRover; OpenTelemetry; SigNoz; Prometheus; Grafana; Uptime Kuma; Trivy; OSV-Scanner; Grype; Syft; Semgrep; Gitleaks; Wazuh; Suricata; Zeek; Headscale; NetBird; Infisical; OpenBao; Nextcloud; Seafile; Postal; Mailpit; Matomo; Plausible; Umami; PostHog; RudderStack; Mattermost; Rocket.Chat; Jitsi; Caddy; Traefik; HAProxy; Nginx; SeaweedFS; Garage; MinIO; Plane; OpenProject; Vikunja; Excalidraw; tldraw; Penpot; Strapi; Directus; Payload; Ghost; Moodle; Open edX.

## Integration rule
For every candidate capability, store:
source repo + revision, license, capability, dependencies, cost boundary, security boundary, local/self-hosted path, adapter shape, tests/health, project fit, verification state.

Never import offensive/security capabilities into unrestricted execution. Security research sources remain constrained by authorization and safety policy.

## Promotion
DISCOVERY -> VERIFIED -> ADAPTER_READY -> INTEGRATED -> TESTED -> HUMAN_READY.
