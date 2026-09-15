---
name: vercel-react-native-skills
description:
  React Native and Expo best practices for building performant mobile apps. Use
  when building React Native components, optimizing list performance,
  implementing animations, or working with native modules. Triggers on tasks
  involving React Native, Expo, mobile performance, or native platform APIs.
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
---

# React Native Skills

Comprehensive best practices for React Native and Expo applications. Contains
rules across multiple categories covering performance, animations, UI patterns,
and platform-specific optimizations.

## Execution contract
1. Confirm the target is React Native/Expo and inspect the project's React Native, Expo, and React versions.
2. Identify the actual bottleneck or requested behavior before applying a rule.
3. Apply the smallest relevant rule set; do not introduce native dependencies solely for style preference.
4. Preserve platform behavior and accessibility while optimizing performance.
5. Validate changes with the project's lint/typecheck/tests and a focused device/emulator smoke test when native behavior is affected.

## Validation checklist
- [ ] React Native/Expo versions verified.
- [ ] Relevant performance or UX baseline identified.
- [ ] List rendering is virtualized where scale requires it.
- [ ] Callbacks/styles/functions avoid unnecessary per-render allocation where relevant.
- [ ] Animations use appropriate GPU-friendly properties and worklet/shared-value rules where applicable.
- [ ] Images, safe areas, navigation, and native modules are handled with platform-appropriate APIs.
- [ ] Accessibility and interaction behavior remain intact.
- [ ] Project tests/lint/typecheck and focused runtime verification pass.

## Rule Categories by Priority

| Priority | Category         | Impact   | Prefix               |
| -------- | ---------------- | -------- | -------------------- |
| 1        | List Performance | CRITICAL | `list-performance-`  |
| 2        | Animation        | HIGH     | `animation-`         |
| 3        | Navigation       | HIGH     | `navigation-`        |
| 4        | UI Patterns      | HIGH     | `ui-`                |
| 5        | State Management | MEDIUM   | `react-state-`       |
| 6        | Rendering        | MEDIUM   | `rendering-`         |
| 7        | Monorepo         | MEDIUM   | `monorepo-`          |
| 8        | Configuration    | LOW      | `fonts-`, `imports-`  |

## Quick Reference
- `list-performance-virtualize` - Use FlashList for large lists
- `list-performance-item-memo` - Memoize list item components
- `list-performance-callbacks` - Stabilize callback references
- `list-performance-inline-objects` - Avoid inline style objects
- `list-performance-function-references` - Extract functions outside render
- `list-performance-images` - Optimize images in lists
- `list-performance-item-expensive` - Move expensive work outside items
- `list-performance-item-types` - Use item types for heterogeneous lists
- `animation-gpu-properties` - Animate only transform and opacity
- `animation-derived-value` - Use useDerivedValue for computed animations
- `animation-gesture-detector-press` - Use Gesture.Tap instead of Pressable
- `navigation-native-navigators` - Use native stack and native tabs over JS navigators
- `ui-expo-image` - Use expo-image for all images
- `ui-image-gallery` - Use Galeria for image lightboxes
- `ui-pressable` - Use Pressable over TouchableOpacity
- `ui-safe-area-scroll` - Handle safe areas in ScrollViews
- `ui-scrollview-content-inset` - Use contentInset for headers
- `ui-menus` - Use native context menus
- `ui-native-modals` - Use native modals when possible
- `ui-measure-views` - Use onLayout, not measure()
- `ui-styling` - Use StyleSheet.create or Nativewind

## How to Use
Read individual rule files for detailed explanations and code examples. Each rule should contain rationale, incorrect/correct examples, and verification notes.

## Full Compiled Document
For the complete guide with all rules expanded: `AGENTS.md`
