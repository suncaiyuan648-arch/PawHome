# Figma Design Source Index

## 2026-09-21 全量逐页验收入口

- [可搜索页面操作卡](全量页面与状态验收手册-20260921.html)：77 个注册页（74 业务页 + 3 开发页），Figma 直链、状态进入说明、验收备注和导出。
- [完整状态机与开发者工具手册](全量页面与状态验收手册-20260921.md)：自定义编译参数、Console 夹具及恢复、68 条原始映射。
- [独立全量治理审查](../architecture-audit/13-20260921全量治理审查.md)：工程门禁通过，非视觉治理尚未整体通过。

下方“两项例外”是 2026-09-15 迁移时的范围，不是当前全量页面例外清单。正式 map 的 68 状态仅覆盖 41 个不同页面；新增/保留旧稿、状态语义错位和无精确节点页面，以新手册逐页说明核对。补充节点仅作为本次在线 metadata 参考，尚不等于视觉批准或 formal map 纠错完成。

## Purpose

`figma-map.yaml` is the repository-level index from PawHome runtime routes/code to exact Figma nodes.

The upstream file is:

```text
逢猫投喂流浪猫板块
file_key: ikwcujfbxtNcjk9tjGjKx8
```

Current canvas: [逢猫投喂流浪猫板块](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8/逢猫投喂流浪猫板块?node-id=0-1).

## 2026-09-15 file migration

Both files were read through Figma MCP. [The reviewed crosswalk](figma-node-migration-20260915.md) and its [machine-readable manifest](figma-node-migration-20260915.json) record 69 unique old → new node mappings, verified by subtree equality or explicit hierarchy/text review. Numeric ID offsets and screenshot similarity were not used.

The formal matrix now has **68 states: 44 verified-metadata mappings and 24 retained-legacy mappings**. The four yard-detail states are bound to `packages/yard/pages/detail/index.vue` after inspecting its `onLoad` whitelist and `PawYardDetailFigma.state`; their QA queries include an explicit local `yardId`. These are static route mappings, not runtime or visual PASS.

Two explicit exceptions remain:

- Search dynamic results `62:28350`: no matching results frame in the new canvas. `83:4109` is an empty result state and cannot replace it. C8 must supply or approve an exact results design before visual acceptance.
- AppHeader/PageNav `1548:3731`: available in the old file, absent from the new file's page inventory. Keep the approved repository component and legacy source; do not substitute a page's native chrome. The exported PawIcon assets also retain their original file/node provenance; no icon re-export took place.

Always use the entry-level `file_key + node_id`. `legacy_node_id` is provenance only. `verified-metadata` means a design correspondence was reviewed, not that business code implements the changed design. `retained-legacy` is visible in the generated matrix. `new_design_references` holds observed new variants without claiming they are implemented routes.

The generator checks reviewed file/node pairs against the manifest and separates local route validity from design correspondence. Old page-document QA claims are historical; current work uses the new mapping and repeats runtime/visual checks. The scope additions are tracked in [governance integration plan](../architecture-audit/11-采纳建议治理增补计划.md).

A URL in the repository does **not** grant Figma access. Codex or another agent still needs an authenticated Figma MCP/connector in its local environment to inspect live nodes.

## Agent lookup order

For UI work:

```text
route / feature request
→ docs/design/figma-map.yaml
→ exact page state + node_id
→ page design_doc
→ docs/pages-design/复用组件.md
→ existing shared component
→ implementation
→ WeChat runtime QA
```

Never pick a Figma frame because its screenshot “looks similar”. The Figma file contains several visually related states such as `动态详情`, `院子详情-动态`, `院子详情-动态展开`, `搜索-动态`, etc.

## Node URL

Figma node URLs use the file key explicitly associated with that node. For the current dynamic detail node:

```text
83:7494
```

Figma's query form uses:

```text
83-7494
```

Example:

```text
https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-7494
```

Agents should prefer `file_key + node_id` through Figma tooling rather than parsing the human URL.

## Visual baseline

`visual-baseline/` is reserved for committed QA reference images.

Recommended structure:

```text
visual-baseline/
├── 首页/
│   ├── dynamic.png
│   └── dynamic-empty.png
└── 动态详情/
    ├── default.png
    └── comments-empty.png
```

Do not automatically replace a baseline with a runtime screenshot. Baseline changes must follow a confirmed Figma/design change.

Until baseline images are committed, page-design Markdown + live Figma node are the visual source.

## Adding a page

When a new page becomes implementation-ready:

1. Add route/source/design_doc.
2. Add all required Figma states and exact node IDs.
3. Create `docs/pages-design/<页面>.md`.
4. Add a visual baseline after design acceptance if useful.
5. Only then instruct Codex to implement/validate the page.

## Unresolved entries

`unresolved_design_states` intentionally contains known Figma nodes whose code route/source has not yet been formally resolved. Agents must not guess a route from those entries.

## State matrix report

Run `node scripts/build-figma-state-matrix.cjs` to generate `.artifacts/architecture-governance/figma-state-matrix.md` and `.json`. The script reads exact node IDs and formal states only from this map; it reads `pages.json` (JSON5) to check that each current route is registered and that the source path exists and matches the route. It does not read exported CSVs, visual metrics, or an adjacent checkout.

The report separates static mapping from runtime reachability. `status: mapped` means the node, route, source, and query contract passed static validation. It is not a runtime or visual acceptance result. A state may declare `runtime.status: fixture-required` and a `runtime.reason` when a real record ID, storage fixture, or caller context is needed to reach the state. Nodes under `component_nodes` and entries under `unresolved_design_states` are reported as excluded scope rather than page states.
