# Project Context Registry

Canonical routing map for work spanning multiple conversations.

| Project ID | Repository/scope | Purpose | Do not conflate with |
|---|---|---|---|
| EASY | salamou1944/Easy- + EASY runtime | Commerce product, customer/seller experience, Creative, Demo, trial | MONY, Elite |
| MONY | Revenue Engine + AI_operating_memory | Online-income/revenue workflows, offers, affiliate and customer paths | EASY Demo, Elite |
| ELITE | salamou1944/agent-skills | Autonomous coding/engineering agent capability | ARMY-14 |
| ARMY-14 | salamou1944/agent-skills | 14-agent field execution and verification | Elite runtime |
| CONTROL_PLANE | salamou1944/agent-skills | Skills, tooling, evidence, security, verification | Product-specific state |
| SALAMOU_31 | salamou1944/Salamou-31 | AI/API hub and sellable services | EASY product state |
| MONY_STATE | salamou1944/AI_operating_memory | Canonical machine-readable MONY state | Human-readable summaries |

## Customer-facing artifacts

### EASY Demo
Independent customer demo. Historical flow: Demo Mode -> Seller Profile/Store -> Upload/Sample Image -> EASY Magic -> Creative Review -> Confirm/Download.
Known fixtures: Leather Bag, Thermal Bottle, Desk Lamp.
This is separate from MONY Demo and Human Trial.

### MONY Demo
Independent customer-facing Revenue Engine demo. It demonstrates MONY's customer/service path before external-provider or revenue transitions. Affiliate flows must preserve attribution/tracking while MONY remains the customer-facing entry point.

### Human Trial
A bounded human-use gate for a specific deployed revision. It is not either Demo and is not a production-completion claim.

## Status integrity
Never use Demo as proof of production; CI as proof of live runtime; pipeline verification as proof of task verification; stale deployment metadata as proof of current revision; or remembered conversation claims as proof when repository/runtime evidence contradicts them.

## Recovery requirement
If a conversation references an artifact absent from this registry, treat it as a recovery candidate and investigate its owning project before modifying another project.
