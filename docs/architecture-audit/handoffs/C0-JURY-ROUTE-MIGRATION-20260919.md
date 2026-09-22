# C0 评审详情语义路由迁移交接（2026-09-19）

`pages/yard/juryDetail.vue` 原来同时承载领养评审和救助审核，按背景色复用造成业务域、写动作和权限语义混淆。本批已完成旧壳拆分：

| 业务域 | canonical 路由 | 责任 |
|---|---|---|
| 领养评审 | `/packages/adoption/pages/jury/detail/index` | 读取 adoption review item，投票动作只写本地 mock jury/application seam |
| 救助审核 | `/packages/rescue/pages/review/detail/index` | 读取 rescue review item，审核动作只写 rescue review adapter |

`pages/yard/juryPanel.vue` 的领养入口改为 canonical adoption 路由；旧 `juryDetail` 已从 `pages.json` 删除。兼容解析器仍要求注入真实 metadata resolver，并在 query 类型与记录类型不一致时 fail-closed，不按第一条任务或颜色猜测业务域。`pages/dev/*` 保留不变。

验证：`npm run check:routes` 74/74、`npm run check:figma-map` 66 formal states、`node --test tests/governance/route-contracts.test.cjs` 26/26；完整构建与 DevTools 运行验收由总工批次统一执行。
