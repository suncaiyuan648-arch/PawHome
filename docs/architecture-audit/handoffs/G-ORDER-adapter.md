# G-ORDER/A06 只读订单 adapter 交接

日期：2026-09-16  
交付者：Luna（xhigh）子 AGENT `/root/order_read_adapter`  
验收层级：W2b adapter-only 子批，待总工复验

## 本批交付

新增 [`packages/feeding/services/orderAdapter.ts`](../../../packages/feeding/services/orderAdapter.ts)，将订单合同绑定到现有只读边界：

- 奖励订单只从 `utils/rewardOrderStorage.ts` 的 `PAWHOME_REWARD_ORDERS` 读取，旧 `recordId` 映射为同值 `applicationId`，无可信申请人/院主关系的历史记录 fail-closed。
- 普通投粮复用现有 `utils/feedingOrderMockApi.ts` 只读 reader，按可信 actor 生成 mine 或 yard-owner scope；不接受 `userPawId`、`yardOwnerId`、`role`、`managed` 等调用方字段来提权。
- `stateKey` 到 `navigation/orderContracts.ts` `status` 只保留显式兼容表；未知状态被跳过并写入诊断，不回落到第一条样例。
- `orderId` 详情与 `applicationId` 赠礼关联查询均要求不透明稳定 ID；缺失、越域、未找到、隐藏和越权均不展示替代订单。
- 每次读取重新解析可信 actor；订单能力重新由 `getOrderAccess` 派生。用户隐藏按 `userId + orderId` 作用于本人，院主合法履约读取不受影响。
- 输出统一带 `success/source/data/error/readOnly/canWrite`，订单项、能力、诊断和列表均冻结；本模块没有写 API、支付、退款、履约提交或 storage 写入。

导出：

- `readOrderList` / `readOrders`
- `readOrderById` / `readOrderDetail`
- `readGiftOrderByApplicationId`

## 反例与测试

新增 [`tests/governance/order-adapter.test.cjs`](../../../tests/governance/order-adapter.test.cjs)，共 **10/10 PASS**：

1. 依赖和只读边界扫描；
2. 已保存奖励订单类型映射与地址私密字段剔除；
3. `applicationId` 稳定关联查询；
4. 普通投粮 mine/yard-owner 可信 actor scope；
5. 赠礼与普通投粮来源隔离；
6. 本人隐藏不影响院主履约读取；
7. 每次重读 actor、精确 ID、无首条 fallback；
8. 伪造 role/managed/owner ID 和非法 visibility fail-closed；
9. 损坏奖励 storage 不修复、不写入；
10. 缺少 actor 关系的 legacy reward 记录不被误展示。

命令：

```bash
node --test tests/governance/order-adapter.test.cjs
```

结果：`10/10` 通过；`git diff --check` 通过；未暂存、未提交。

## 遗留边界

- `feedingOrderMockApi.ts` 当前仍是本地只读样例 reader，并没有独立持久化投粮订单仓储；本批没有新增 storage key 或改变 mock schema。接入真实后端时替换该 reader，并保持 `orderContracts.ts`、trusted actor、精确 ID 和失败语义。
- 当前 `rewardOrderStorage` 的历史奖励记录可能没有 `userId`/`yardOwnerId`；adapter 不从姓名、query、`managed` 或页面上下文猜测关系，因此这类记录会进入诊断并保持不可见。C5/C2 后续需在批准的数据迁移或后端 envelope 中补齐关系字段。
- `hiddenEntries` 是只读调用边界输入，本批未新增持久化隐藏表；后续页面/服务接入需绑定现有或获批准的用户可见性存储，不得把隐藏状态混入订单主体。
- 本批未修改页面、`pages.tson`、路由注册、支付/退款/履约 writer；页面接入、返回刷新和 Figma/UI/runtime 六项证据仍待 C5/C2/C9。
