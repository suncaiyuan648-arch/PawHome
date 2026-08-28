# Figma Design Source Index

## Purpose

`figma-map.yaml` is the repository-level index from PawHome runtime routes/code to exact Figma nodes.

The upstream file is:

```text
逢猫投喂流浪猫板块
file_key: 03pt0RiVfBFCvn4PsIyezk
```

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

Figma node URLs use the same file key. For a node such as:

```text
62:27383
```

Figma's query form uses:

```text
62-27383
```

Example:

```text
https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk/...?...node-id=62-27383
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
