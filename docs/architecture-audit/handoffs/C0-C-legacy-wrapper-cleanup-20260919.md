# C0 旧包装页清理交接

> 后续批次说明（2026-09-19）：本交接中的 canonical `pages/meMore/feedingDetail` 已继续迁移至 `/packages/feeding/pages/order/detail/index`；90/91/92 的 state 语义保持不变。当前状态以 [C0 feeding detail route migration](C0-FEEDING-DETAIL-ROUTE-MIGRATION-20260919.md) 为准。

- task: `C0-C-legacy-wrapper-cleanup`
- owner: `/root/c0_orphan_page_cleanup`
- date: `2026-09-19`
- scope: 无静态 caller 的旧包装页迁移、生产路由注销与源文件清理
- backend: 未接入；只使用现有本地页面状态和组件

## 已完成

以下旧生产页已经迁移到已有 canonical 页面并从 `pages.json` 与源码树移除：

| 旧路径 | canonical 页面 | 迁移状态 |
|---|---|---|
| `/pages/meMore/feedingDetail90` | `/pages/meMore/feedingDetail?variant=90` | `feedingDetail.vue` 已支持 `variant`，旧一行包装页无静态 caller |
| `/pages/meMore/feedingDetail91` | `/pages/meMore/feedingDetail?variant=91` | `feedingDetail.vue` 已支持院主视角与反馈态，旧一行包装页无静态 caller |
| `/pages/meMore/feedingDetail92` | `/pages/meMore/feedingDetail?variant=92&orderId=...&recordId=...` | canonical 页面和 `PawFeedingDetailFigma` 已承载云养/物流字段，旧页不再注册 |
| `/pages/publishDynamic/postFeedOrder` | `/pages/publishDynamic/postFeed?state=select-order` | 选择订单 sheet 已由发布编辑器持有；旧页只是重复包装 |
| `/pages/adoption/pickCats` | `/pages/adoption/adoptApply?state=pick-cats` | 选择宠物 sheet 已由领养申请页持有；canonical 页增加透明 picker-only 状态 |

对应 Figma map 的 `select_order`、`pick_cats` 状态已改为 canonical route/source，并携带显式 state query。Figma node 与设计状态保留，避免把设计状态误删；生产页面注册不再保留。

## 证据

- 生产源码静态搜索未发现上述旧路径的页面/组件 caller；旧页面仅存在于 `pages.json`、Figma map 和历史审计文档。
- `postFeed.vue` 在 `state=select-order` 时打开现有 `PawOrderSelectSheet`。
- `adoptApply.vue` 在 `state=pick-cats` 时隐藏申请页主体、以透明壳打开现有 `AdoptPickCatsSheet`，确认后进入 canonical 领养申请页，关闭时安全返回。
- 旧投喂 90/91/92 页面删除前已核对 canonical `feedingDetail.vue` 的 variant、orderId、recordId、deliveryStatus、deliveryProgress 入口。

## 验证

```text
focused: tests/governance/c0-route-cleanup.test.cjs  PASS
npm run check:figma-map                                      PASS
npm run check:routes                                         PASS
```

本批不执行真实后端、支付、领养提交、动态发布或任何生产写入。生产 build、包体和 DevTools 运行/视觉验收由总工在共享工作树串行复验。

## 风险与后续

- 历史审计文档仍可能提及旧路径，这些是历史证据，不是生产注册；后续台账应以当前 `pages.json`、Figma map 和本交接为准。
- 外部未登记深链若仍直接访问旧路径，将无法继续使用；本批基于仓库内无静态 caller 和用户要求“迁移验证后移除旧页面”执行清理。若产品后续确认存在外部深链，应通过 `navigation/legacyRoutes.js` 增加受控兼容映射，不应恢复旧页面文件。
