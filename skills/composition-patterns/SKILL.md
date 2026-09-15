---
name: vercel-composition-patterns
description:
  React composition patterns that scale. Use when refactoring components with
  boolean prop proliferation, building flexible component libraries, or
  designing reusable APIs. Triggers on tasks involving compound components,
  render props, context providers, or component architecture. Includes React 19
  API changes.
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
---

# React Composition Patterns

Composition patterns for building flexible, maintainable React components. Avoid
boolean prop proliferation by using compound components, lifting state, and
composing internals. These patterns make codebases easier for both humans and AI
agents to work with as they scale.

## When to Apply

Reference these guidelines when:
- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers

## Execution contract
1. Inspect the component API and count behavior-changing boolean props.
2. Identify state ownership and sibling-sharing requirements before refactoring.
3. Prefer explicit variants, compound components, context interfaces, or children-based composition over boolean mode flags.
4. Preserve public behavior with focused tests for each existing variant and interaction.
5. For React 19 code, verify the chosen context/ref APIs against the project's actual React version before changing them.

## Validation checklist
- [ ] Existing behavior has a test or reproducible verification.
- [ ] New API does not add avoidable boolean-prop proliferation.
- [ ] State ownership is explicit and dependencies are injectable.
- [ ] Compound/context composition has stable contracts.
- [ ] React version is verified before applying React 19-specific guidance.
- [ ] Refactor passes typecheck/lint/tests used by the project.

## Rule Categories by Priority

| Priority | Category                | Impact | Prefix          |
| -------- | ----------------------- | ------ | --------------- |
| 1        | Component Architecture  | HIGH   | `architecture-` |
| 2        | State Management        | MEDIUM | `state-`        |
| 3        | Implementation Patterns | MEDIUM | `patterns-`     |
| 4        | React 19 APIs           | MEDIUM | `react19-`      |

## Quick Reference
- `architecture-avoid-boolean-props` - Don't add boolean props to customize behavior; use composition
- `architecture-compound-components` - Structure complex components with shared context
- `state-decouple-implementation` - Provider is the only place that knows how state is managed
- `state-context-interface` - Define generic interface with state, actions, meta for dependency injection
- `state-lift-state` - Move state into provider components for sibling access
- `patterns-explicit-variants` - Create explicit variant components instead of boolean modes
- `patterns-children-over-render-props` - Use children for composition instead of renderX props
- `react19-no-forwardref` - React 19+ only; verify project version before applying

## How to Use
Read individual rule files for detailed explanations and code examples. Each rule should provide rationale, incorrect/correct examples, and verification notes.

## Full Compiled Document
For the complete guide with all rules expanded: `AGENTS.md`
