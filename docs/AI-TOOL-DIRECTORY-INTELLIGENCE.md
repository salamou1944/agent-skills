# AI Tool Directory Intelligence Signal

## Why this matters

AIxploria currently presents itself as a large AI-tool directory with more than 6,000 analyzed/listed tools, 72 categories, daily updates, and manual verification. Its current category index exposes useful discovery surfaces including AI agents, developer tools, automation, e-commerce, marketing, sales/conversion, image/video generation, research, GitHub projects, and more. citeturn0search0turn0search1

The important engineering value is **not the raw number of tools**. The value is a continuously changing discovery surface that can feed our provider and capability research.

## Architecture added to the system

`directory source → candidate inventory → normalize → primary-source verification → deterministic experiment → provider registry → routing/fallback → measurement → retirement`

This is deliberately separate from production routing. A directory listing is a lead, not acceptance evidence.

## MONY

Potential discovery lanes:
- video generation/editing
- image/design
- marketing and SEO
- sales/conversion
- e-commerce
- automation
- research
- AI agents
- developer tools

AIxploria's current index exposes hundreds of entries in several of these categories, including 312 video generators, 300 image generators, 264 developer tools, 260 business tools, 189 marketing tools, 110 e-commerce tools, and 160 AI-agent listings. These counts are directory metadata and can change; they are not quality or market-size measurements. citeturn0search1

MONY should use these categories to generate provider candidates, then verify the provider itself and measure accepted-artifact economics.

## Elite / ARMY-14

The directory can also act as an external capability sensor for discovering:
- coding assistants
- agent frameworks
- automation systems
- research utilities
- multimodal tools
- GitHub projects
- evaluation/observability components

Candidates enter Elite only after task-specific verification. This protects the existing evidence-driven contract.

## Important guardrail

AIxploria has a "Free AI" index, but "Free" must not be interpreted as:
- unlimited,
- API-accessible,
- commercially licensed,
- production reliable,
- privacy-safe,
- or economically superior.

The current free index itself exposes filters and many entries, but provider terms and limits remain separate facts that must be verified. citeturn0search2

## Operational result

The useful change is therefore a **directory-intelligence layer**, not a giant hard-coded list of thousands of tools.

That layer should continuously turn external discovery into:
1. candidate capability,
2. verified provider,
3. reproducible experiment,
4. measured artifact,
5. production route or explicit rejection.

This prevents tool-directory noise from polluting Elite or MONY while still harvesting useful new capabilities quickly.
