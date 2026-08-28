# AGENTS.md — PawHome Agent Development Guide

## 1. Repository

PawHome is a Vue 3 + uni-app WeChat Mini Program.

Package manager: **npm** (`package-lock.json` is the dependency lockfile).

Primary commands:

```bash
npm run dev:mp-weixin
npm run build:mp-weixin
```

WeChat development output:

```text
unpackage/dist/dev/mp-weixin
```

## 2. Design source of truth

The Figma design index is:

```text
docs/design/figma-map.yaml
```

The Figma file is the upstream design source of truth. The repository design docs are the implementation and acceptance bridge.

Before changing any UI:

1. Resolve the route/page/state in `docs/design/figma-map.yaml`.
2. Read the page design document referenced by that entry.
3. Read `docs/pages-design/复用组件.md`.
4. Reuse an existing approved component before creating page-local UI.
5. If Figma tooling is available, inspect the exact `node_id` from the map.
6. If Figma tooling is unavailable, use the local design docs and visual-baseline policy in `docs/design/README.md`.
7. **Never guess a Figma node by visual similarity.**

Known design docs:

```text
docs/pages-design/首页.md
docs/pages-design/动态详情.md
docs/pages-design/复用组件.md
```

## 3. Figma access rule

A Figma URL in the repository tells the agent **where the design is**; it does not grant Figma permissions by itself.

If the local Codex environment has Figma MCP/connector access, use:

```text
file_key + exact node_id
```

from `docs/design/figma-map.yaml`.

If Figma cannot be reached, do not invent dimensions/colors/assets. Use the repository page-design docs and report the missing live-Figma verification explicitly.

Do not commit temporary Figma MCP asset URLs into production code.

## 4. UI rules

- Figma is the design source of truth.
- Page design docs define implementation/acceptance details.
- Do not recreate an approved shared pattern in a page-local CSS block.
- Do not solve structural differences by appending duplicate selectors at the end of a page.
- Photos should use proportional crop/fill behavior; do not use `scaleToFill` unless distortion is explicitly intended by design.
- Prefer exact local assets when their glyph matches Figma.
- Do not draw fake WeChat status bars, capsule controls, or Home Indicators in MP runtime.
- Preserve real safe-area behavior.

Identity labels are semantically distinct:

```text
Owner != Verified != Level != YardTag != Status
```

Do not substitute one component for another.

## 5. WeChat DevTools runtime workflow

Detailed setup:

```text
docs/development/Codex-微信开发者工具自动调试方案.md
```

Preferred runtime path:

```text
Codex
→ npm run dev:mp-weixin
→ unpackage/dist/dev/mp-weixin
→ WeChat Developer Tools Nightly / wechatide
→ simulator / console / network / automation / screenshot
```

After meaningful UI changes, runtime verification is required when the environment supports it.

Final UI-task status should report:

```text
BUILD
RUNTIME
CONSOLE
INTERACTION
GEOMETRY
VISUAL
```

A successful build alone does not prove Figma alignment.

For 375px design-baseline geometry, target approximately:

```text
±1px
```

Wait for animations to settle before screenshots.

## 6. Stable QA selectors

High-value runtime acceptance points may use stable IDs:

```text
qa-<page>-<element>
```

Examples:

```text
qa-dynamic-detail-media
qa-dynamic-detail-comment-composer
qa-dynamic-detail-yard-summary
qa-dynamic-detail-bottom-bar
qa-dynamic-detail-primary-action
```

Do not rely on deeply nested `nth-child` selectors.

## 7. Change discipline

For large Figma fixes:

```text
1–3 related issues
→ build
→ runtime check
→ geometry/screenshot
→ next iteration
```

If the same visual difference fails to improve for two iterations, stop blind CSS tuning and investigate root cause:

```text
shared component
CSS inheritance
px/rpx conversion
safe area
native component behavior
conditional compilation
stale DevTools cache
```

Do not change an approved shared-component default just to satisfy one page. Add a design-approved variant when the difference is real.

## 8. Motion

Use the motion rules in:

```text
docs/pages-design/复用组件.md
```

Prefer `transform` and `opacity` for animation. Avoid decorative continuous motion unless product/design explicitly requires it.

## 9. Safety

Do not perform the following unless the user explicitly requests it:

```text
mini-program upload / formal release
production destructive writes
payments
real feeding/adoption submissions
```

Local simulator debugging, screenshots, console/network reads, and test-data interactions are allowed.

## 10. Generated QA artifacts

Store local QA output under:

```text
.artifacts/
```

Do not commit generated screenshots/logs/reports unless the user explicitly requests a visual-baseline update.
