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
- **CRITICAL — native WeChat/OS chrome is reference-only and must never be reimplemented.** In `MP-WEIXIN`, the OS owns the status bar and bottom Home Indicator/system gesture bar, and WeChat owns the top-right operation capsule. Never render time, signal, Wi-Fi, battery, notch/Dynamic Island, capsule dots/circle/divider/border/background, Home Indicator, system gesture bar, or bottom drag bar from business code. “It matches the Figma screenshot” is not an exception.
- Application code may only read native geometry, reserve space, and avoid overlap. `components/PawPageNav.vue` + `utils/navLayout.js` are the only top-navigation geometry source of truth. Pages/components must not call `getMenuButtonBoundingClientRect()` directly, must not position navigation business content from `statusBarHeight + N`, and must put top avatar/name/identity content in `PawPageNav`'s `#content` slot.
- `PawPageNav` is always `position: fixed` and must provide its own flow placeholder with height exactly equal to the runtime navigation height. It must not own page content spacing or expose `bottomGap`, `designBottomGap`, `contentOffset`, or `pageTopPadding`; page-level padding/margins belong to the page.
- The right side of `PawPageNav` is a transparent native-capsule reserve only. Do not use a right/default slot, CSS rounded rectangle, dots/circle glyphs, or Figma device-chrome assets to redraw it. `env(safe-area-inset-bottom)` is a layout inset for business bottom bars; it is never a reason to draw a black rounded system drag bar.
- Read [`docs/AGENTS-native-ui-rules.md`](docs/AGENTS-native-ui-rules.md) and [`docs/pages-design/PawPageNav.md`](docs/pages-design/PawPageNav.md) before changing navigation or bottom safe-area behavior.
- Preserve real safe-area behavior.

Identity labels are semantically distinct:

```text
Owner != Verified != Level != YardTag != Status
```

Do not substitute one component for another.

Before claiming a UI task complete, run:

```bash
npm run check:native-ui
```

For navigation, native-chrome, or bottom-safe-area changes, also run:

```bash
npm run verify:ui
```

If the native UI guard fails, fix the implementation. Do not delete/disable the guard, rename a fake-native class to evade it, or add/increase `config/native-ui-legacy-baseline.json` allowances during ordinary feature work. The baseline freezes historical debt only; new violations must fail.

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

### DevTools window reuse rule

Codex/coder must only operate on an already-open WeChat Developer Tools project window.
Do not call `open_project_window`, use an auto-open/auto-reopen flow, or launch another
DevTools instance for testing. Before simulator, console, network, automation, or
screenshot actions, verify that the existing window is available and points to the
compiled project at `unpackage/dist/dev/mp-weixin`. If no usable window is open, stop
and ask the user to open it manually; do not create a new window or silently recover by
starting another process.

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
