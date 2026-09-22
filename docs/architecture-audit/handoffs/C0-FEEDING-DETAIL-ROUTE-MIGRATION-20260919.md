# C0 投喂订单详情语义路由迁徙交接

日期：2026-09-19  
范围：`pages/meMore/feedingDetail.vue` 及 90/91/92 旧别名页  
边界：仅本地/mock 读模型与路由迁徙，不接入真实后端、支付、履约或真实投喂写入。

## 迁移结果

| 旧入口 | canonical 入口 | 结果 |
|---|---|---|
| `/pages/meMore/feedingDetail` | `/packages/feeding/pages/order/detail/index` | 旧详情页已删除；订单列表和任务/消息目标统一使用 `feeding.order.detail` |
| `/pages/meMore/feedingDetail90` | canonical `?variant=90` | 旧包装页和注册已删除 |
| `/pages/meMore/feedingDetail91` | canonical `?variant=91&perspective=yard-manager` | 旧包装页和注册已删除 |
| `/pages/meMore/feedingDetail92` | canonical `?variant=92` | 旧包装页和注册已删除 |

canonical 页面优先通过 `orderId` 读取 `packages/feeding/services/orderRuntime.js` 的持久订单；只有显式 variant/type 兼容夹具且持久订单不可用时，才使用本地 `feedingOrderMockApi` 生成视觉态。variant 只选择本地/mock 展示，不授权读取、反馈或写入。

`PawFeedingDetailFigma` 和 `PawToast` 已从 `pages/meMore/components` 下沉到 `packages/feeding/components`，消除了旧页面对 meMore 私有组件的依赖。两个投喂列表页改用 `buildRoute('feeding.order.detail', { orderId, perspective })`，消息、任务和深链继续指向同一 canonical route。

## 验收证据

```text
npm run test:governance       336/336 PASS
npm run check:routes          71/71 PASS
npm run check:figma-map       48 formal states PASS
npm run check:ui              PASS
npm run build:mp-weixin       PASS
npm run check:package:final   PASS
git diff --check              PASS
```

final 包体：主包 **1,571,287 bytes**，目标 **1,572,864 bytes**，余量 **1,577 bytes**；全量 **4,108,134 bytes**；`packages/feeding` **173.9 KiB**。旧路由/源文件由 `tests/governance/c0-route-cleanup.test.cjs` 断言不可重新注册。

DevTools CLI 的模拟器跳页仍受现有 APPID/TLS 网络错误影响，本批没有宣称完整运行、几何或视觉 PASS；未执行真实业务写入。
