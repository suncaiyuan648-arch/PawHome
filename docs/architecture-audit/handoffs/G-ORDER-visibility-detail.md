# G-ORDER 订单详情与隐藏偏好

日期：2026-09-19

## 已交付

- `packages/feeding/pages/order/detail/index.vue` 注册到 `packages/feeding` 分包，页面只读取当前可信 actor 可见的普通投喂/领养赠礼订单摘要。
- `packages/feeding/services/orderVisibilityStorage.js` 以 `{ userId, orderId }` 持久化隐藏偏好；隐藏/恢复幂等，跨用户和跨业务 ID 拒绝，订单及小院履约记录不变。
- 详情页先重读隐藏偏好；隐藏订单显示恢复入口，不通过隐藏标记改变订单状态或访问权限。
- 支付、退款、再买、打款和真实履约写入未开放。

## 验证

- `tests/governance/order-visibility-storage.test.cjs`：3/3 PASS。
- `npm run check:routes`：73/73；分包边界 PASS。
- 订单详情继续复用 `packages/feeding/services/orderAdapter.js` 的普通投喂/领养赠礼类型区分和 actor 可见性合同。

## 限制

订单 adapter 仍是现有持久 reader 的同步接入层，未接真实后端支付/履约系统；因此页面仅报告“详情暂不可用”，不创建 demo 订单。
