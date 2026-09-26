# Capability sources — 2026-09-26

This file records sources to mine for implementation patterns. It is not proof that a source is integrated.

## Existing collection sources
- Project-/COLLECTION: canonical collection index and provenance graph.
- aw-junaid: 33 repositories.
- mufeedvh: 43 repositories.
- Panniantong: 38 repositories.
- Nmap ecosystem: 7 repositories.
- Weekly Top Five.
- Agent Reach families.
- mnfst/awesome-free-llm-apis.

## Additional GitHub sources discovered during the operator build
- incline-ltd/awesome-agentic-engineering — agent workflows, MCP, verification, sandboxing, security patterns.
- uber/ADR — agent discovery, telemetry, benchmark and defensive detection.
- msoedov/agentic_security — LLM/agent vulnerability scanning and red-team evaluation.
- secureagentics/Adrian — runtime agent monitoring and intervention patterns.
- github/gh-aw — GitHub-native agentic workflows with sandboxing, scoped permissions, gated outputs and cost controls.
- cohaaan/all-agentic-coding-tools — landscape of coding agents and capability dimensions.
- Ryvos/ryvos — self-hosted agent runtime with tools, DAG orchestration, MCP and sandboxing.
- Corvidae-Coding-Projects/OpenClaudia — agent harness/provider/session/tool/review architecture; treat its own audit warnings as evidence that presence is not readiness.

## Collection-derived implementation families
Research/search: SearXNG, Jina Reader, Firecrawl, Crawl4AI, Scrapy.
Browser: Playwright, Browser Use, Writ, WebOperator, WebNav, AgentBrowser.
Documents: Docling, OCRmyPDF, Tesseract.
AI runtime: Ollama, llama.cpp, vLLM, LocalAI, LiteLLM, Open WebUI.
Automation: n8n, Activepieces, Windmill, Temporal, Airflow, Dagster, Kestra, Huginn.
Security: Nmap, Trivy, OSV-Scanner, Grype, Syft, Semgrep, Gitleaks, Wazuh, Suricata, Zeek.
Observability: OpenTelemetry, SigNoz, Prometheus, Grafana, Uptime Kuma.
Storage/data: MinIO, SeaweedFS, Garage, Qdrant and other collection-indexed stores.
Commerce/support: Medusa, Saleor, Vendure, Chatwoot, Zammad, Twenty, EspoCRM, SuiteCRM.
Networking: Headscale, NetBird, Caddy, Traefik, HAProxy, Nginx.

## Promotion rule
A source becomes an Operator capability only after:
1. source/revision is recorded;
2. license/dependency/cost boundary is known;
3. implementation is inspected;
4. adapter contract is defined;
5. local fixture or runtime test passes;
6. health/reachability is measured;
7. independent verification evidence exists.

Never equate a catalog entry, star count, README claim or Top Five membership with operational capability.

- multica-ai/multica — agent workspace/runtime/task-routing patterns: agent identity, runtime separation, durable runs, review gates, skills, access scopes, autopilot scheduling. Source inspection completed; license boundary requires exact LICENSE review before code reuse.
