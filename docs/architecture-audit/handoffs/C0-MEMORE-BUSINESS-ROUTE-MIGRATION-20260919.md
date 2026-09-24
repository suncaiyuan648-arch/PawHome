# C0 meMore 业务页语义路由迁移交接

日期：2026-09-19

## 已完成

以下旧生产页面已在 canonical 路由注册、源码双向检查和 caller 切换后删除：

| 旧页面 | canonical 页面 | 说明 |
|---|---|---|
| `pages/meMore/myAdoption.vue` | `packages/adoption/pages/mine/index.vue` | 当前申请人的领养列表，点击记录进入 `adoption.progress` |
| `pages/meMore/adoptionConfirm.vue` | `packages/adoption/pages/confirmation/index.vue` | `applicationId` 必填，缺少 ID 时 fail-closed，不读取最近申请兜底 |
| `pages/meMore/myFeedings.vue` | `packages/feeding/pages/mine/index.vue` | `userId`/本地 actor 上下文，详情统一进入 `feeding.order.detail` |
| `pages/meMore/yardFeedOrders.vue` | `packages/feeding/pages/yard-orders/index.vue` | `yardId` 定位小院履约列表，详情统一进入 `feeding.order.detail` |

既有救助证实旧页也已由 canonical `packages/rescue/pages/proof/list/index` 与 `proof/create/index` 承载并删除。投喂列表私有组件已随业务下沉到 `packages/feeding/components/PawFeedingOrderList.vue`。

## 边界

- 仅使用本地/mock storage 和既有 `feedingOrderMockApi`，不接入真实后端、支付、提交或生产写入。
- `pages/meMore/adoptionFlow.vue` 已在后续 C0 批次删除；领养/救助进度分别由 `packages/adoption/pages/progress/index` 与 `packages/rescue/pages/progress/index` 承载，旧链接只由 `navigation/legacyRoutes.ts` 做只读兼容解析。详见 [C0 adoption flow handoff](C0-ADOPTION-FLOW-ROUTE-MIGRATION-20260919.md)。
- `myAssets`、`myCloudPets`、地址页和小院管理聚合页暂不删除，因其仍缺少完整的一对一 canonical 页面或需要继续拆分；`pages/dev/*` 保留为开发专用页面。

## 验证

```text
check:routes                 71 registered / 71 source
check:figma-map              60 formal states
c0-route-cleanup             5/5 PASS
```

总工需在本批与动态、账号、领养/救助迁移合并后重新运行 `npm run test:governance`、`npm run check:ui`、`npm run build:mp-weixin`、`npm run check:package:final` 和 `git diff --check`。
