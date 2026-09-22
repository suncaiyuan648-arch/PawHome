# C0 小院详情语义路由迁移 · 2026-09-20

## 范围

将旧 `/pages/commodityDetails/index` 从通用页面根迁入 `packages/yard`，明确它只负责小院详情，不再以“商品详情”命名或承载跨域模式。

| 旧路由 | canonical 路由 | 参数与职责 |
|---|---|---|
| `/pages/commodityDetails/index` | `/packages/yard/pages/detail/index` | `yardId` 必填；`state=dynamic|dynamic-empty|feeding|dynamic-expanded` 仅选择小院详情展示状态，`popup` 与回复状态继续由页面内状态承载。 |

## 迁移处理

- 删除 `pages.json` 中的 `pages/commodityDetails` 分包注册与旧源码。
- 将源码迁入 `packages/yard/pages/detail/index.vue`，使用 `yardId` 读取入口；缺少或非法 ID 时显示 fail-closed 空态，不渲染默认小院详情。
- `openYardDetail`、首页、动态详情、救助详情、领养宠物详情与个人资料入口统一切换到 canonical 路径；分享路径也只生成 `yardId`。
- Figma 四个小院详情状态（`83:6085`、`83:6528`、`83:6787`、`83:7045`）更新为 canonical 路由，QA query 带显式 `yardId=1` 作为本地 fixture 定位。
- 仍复用根目录共享基础组件；没有引入真实后端、创建/认证/投喂/领养写入或新的公共依赖。

## 验收

```text
node --test tests/governance/c0-route-cleanup.test.cjs tests/governance/route-contracts.test.cjs
npm run check:routes
npm run check:figma-map
npm run test:governance
npm run check:ui
npm run build:mp-weixin
npm run check:package:final
git diff --check
```

本批静态、构建、资源/边界和包体门禁由总工程师复验；新的 DevTools 运行/交互/几何/视觉证据需在用户手动打开并保持运行的项目窗口中补齐。`pages/dev/*` 保留为开发专用页面。
