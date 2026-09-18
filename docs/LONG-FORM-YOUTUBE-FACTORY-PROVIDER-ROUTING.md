# Long-Form YouTube Factory — Provider Routing Signal

## Purpose
Extend MONY's short-form production lane into 5–15 minute YouTube production while preserving provider independence and measurable economics.

## Provider capability map
- InVideo AI: prompt → script → visuals → voiceover → subtitles → edit → publish; current YouTube workflow supports frequent faceless production and multilingual translation.
- Pictory: text/article/document → scenes, voiceover and captions; suited to script/article-led production.
- Fliki: explicit 5–15 minute faceless YouTube workflow with chaptered scenes, b-roll, AI voiceover and subtitles; can repurpose the same project to Shorts.
- Lumen5: idea → script → scene selection → captions → optional voiceover, with direct editing and publishing.
- VEED AI: treat as an editing/AI-production provider and verify the exact current automation/API/export capability before routing production workloads.
- NexLev: intelligence layer rather than the renderer: YouTube/channel/video search, transcripts, comments, outliers, suggested videos, thumbnails, channel analytics, monetization and RPM data through MCP.
- Kompozy: useful as a workflow/strategy signal for faceless YouTube production and originality controls; verify production APIs before treating it as a runtime dependency.
- TubeGen AI: end-to-end YouTube generation with script, voice, image/video generation and explicit production-minute/credit economics.

## MONY architecture
research → niche/channel intelligence → topic selection → script → fact/claim validation → scene plan → provider routing → voice/visual generation → edit → thumbnail/title/description → artifact QA → disclosure/license check → publish → analytics → repurpose to Shorts → revenue attribution

## Important addition
NexLev should sit upstream of the video renderer. It can supply channel/video intelligence, transcripts, outlier detection, comments, analytics and monetization signals; production providers then turn validated opportunities into videos.

## Economics
Every generated video records provider, credits/minutes consumed, generation time, revision count, accepted-artifact cost, publishing result and downstream performance. A tool's advertised speed is not treated as revenue evidence.

## Originality / platform integrity
AI generation is not itself proof of quality or monetization. The pipeline must preserve original editorial decisions, factual validation, rights/licensing evidence and required AI disclosures. Avoid mass-producing near-identical videos solely for volume.

## Routing rule
Use the cheapest provider that satisfies the verified artifact contract, not the cheapest provider in isolation. Maintain fallback providers for important lanes and BLOCKED status when credentials, quota, rights or validation requirements are missing.