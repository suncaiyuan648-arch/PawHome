# G-ORDER/A06 订单类型与可见性合同交接

日期：2026-09-16  
交付者：Luna（xhigh）  
验收层级：W2a contract-only 子批

## 交付范围

新增 [`navigation/orderContracts.ts`](../../../navigation/orderContracts.ts)，保持纯 JavaScript 合同。它没有 Vue、uni-app、页面、分包或 storage 依赖，也没有直接执行写入。域 adapter 后续注入可信 actor、订单读取器和显式确认写入的 writer。

合同冻结以下边界：

- `normal_feed` 与 `adoption_gift` 是两个明确的订单类型。领养赠礼没有普通投喂的付款、退款、再买能力；院主履约能力单独按可信 actor 与订单归属计算。
- 领养赠礼必须有 `applicationId` 或旧 `recordId`。两者同时存在时必须相等，归一化后指向同一申请单；普通投喂禁止携带这两个字段，避免把 generic recordId 当作申请关联。
- 赠礼订单按 `applicationId` 做唯一关联。重复请求返回已有订单且不调用 writer；同一申请出现两条订单时，订单集合直接失败关闭。
- 用户隐藏记录由 `userId + orderId` 组成，键为 `order-visibility:<userId>:<orderId>`。隐藏只影响该用户的订单读取；合法院主仍可读取和履约。
- 写能力必须同时满足可信 actor 身份、订单归属、角色关系和合法订单状态。订单 `status`、URL、query、`managed` 或伪造 role 都不能单独授权；未知操作返回 false。
- `saveRewardOrder` 只把 writer 返回 `true` 或 `{ success: true }` 视为成功。writer 返回 false/undefined 或抛错均返回 `STORAGE_WRITE_FAILED`，绝不伪造成功；读取异常也不会 fallback 到第一条 demo 记录。
- 订单、申请和 visibility ID 使用不透明 ID 白名单。未知字段、别名冲突、URL、跨域前缀、无关联赠礼和非法状态均 fail-closed。

## 测试与反例

[`tests/governance/order-contracts.test.cjs`](../../../tests/governance/order-contracts.test.cjs) 覆盖 12 个测试：

1. 纯合同依赖扫描。
2. 普通投喂/领养赠礼类型隔离。
3. `applicationId`/`recordId` 单一关联与冲突。
4. 未知、URL、跨域 ID 与未知字段。
5. 赠礼幂等和重复关联拒绝。
6. 用户隐藏不影响院主读取/履约。
7. 赠礼禁止付款/退款/再买。
8. status/query/role 伪造不能提权。
9. malformed actor/order/visibility fail-closed。
10. writer 失败、无确认、读取异常与 normal feed 错用。

## 验收边界

本子批只冻结类型、关联、可见性、能力和注入式保存结果合同，**未接入** `utils/rewardOrderStorage.ts`、`utils/applicationMockApi.ts`、投喂订单详情、页面、路由或实际后端。没有宣称 G-ORDER 业务链路完成，也没有执行真实订单、支付、退款、履约或 DevTools 交互。

总工接入时必须串行完成：

1. 让 C5 adapter 将现有奖励订单映射为 `adoption_gift`，保留 `PAWHOME_REWARD_ORDERS` 单一存储，并把旧 `recordId` 兼容为同值 `applicationId`。
2. 将现有普通投喂订单映射为 `normal_feed`，禁止详情读取缺 ID 时 fallback 到第一条 demo。
3. 让页面和写 adapter 在真实读取后重新计算能力；不能把按钮隐藏当作鉴权。
4. 接入后补本地 mock 的订单详情、用户隐藏、院主履约和返回刷新验收，并按 11 号计划执行 build 与包体门禁。

## 未修改项

本批没有修改 `pages.tson`、页面、storage、package scripts、lockfile、native UI baseline，没有真实写入，没有提交或暂存。
