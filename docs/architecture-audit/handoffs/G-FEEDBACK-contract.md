# G-FEEDBACK/A07 反馈任务与证据合同交接

日期：2026-09-16  
交付者：Luna（xhigh）  
验收层级：W2a contract-only 子批

## 交付范围

新增 [`navigation/feedbackContracts.ts`](../../../navigation/feedbackContracts.ts)，保持纯 JavaScript、只读合同。文件不依赖 Vue、uni-app、页面、分包、storage、mock 或网络，也不提供真实写入。调用方必须注入已解析的订单/动物关联、显式反馈策略和当前时间；任务汇总与私密读权限还必须传入每次重新读取的 `actorProvider`，不能把页面/query 中的普通 actor 当凭证。

合同冻结以下边界：

- 普通动态 `dynamic` 与投粮反馈证据 `feeding_evidence` 分开。普通动态只能以 `dynamicId` 作为证据承载；投粮证据必须带 `dynamicId`，并同时通过订单、动物和小院的精确关联校验。
- 订单与动物必须来自调用方已读取的关联记录：`order.animalId === animal.animalId` 且 `order.yardId === animal.yardId`。跨院、跨动物、URL/path ID、缺关联或 query/managed 等未声明字段均 fail-closed。
- 策略必须显式提供版本、适用证据类型、`requiredCount`、`maximumCount`、生效/过期窗口、每种证据状态的计数规则，以及 `lastFeedbackStates`。删除、撤回、更正如何影响计数由 policy 注入；缺 policy 或缺任一规则不能推导默认值。
- `feedbackBusinessKey` 包含证据类型、业务对象、动物/小院（投粮证据）、actor 和策略版本，并使用 `attemptKey` 区分不同合法反馈。`requestId` 只构成请求键，因此同一反馈的网络重试不会新增计数；同一 `requestId` 复用于不同业务键会失败。
- 证据按业务键去重，使用最新 `createdAt` 的状态；同一时间存在冲突状态直接失败。只有满足 `startsAt <= createdAt <= expiresAt`（有边界时）且 `createdAt <= now` 的证据进入计数和 `lastFeedbackAt`；缺少起止边界时仍以 `now` 排除未来证据，边界值本身可计入。读模型由 policy 计算 `requiredCount`、`maximumCount`、`completedCount`、`nextFeedbackAt`、`lastFeedbackAt`、`expiresAt`、`scheduled/pending/completed/excess/overdue` 与超限标记。
- `mutationIntent=delete|withdraw|correct` 当前明确返回 `MUTATION_INTENT_NOT_SUPPORTED`。合同不开放删除、撤回、更正或订单/动物写入；动态证据也不授予订单或动物写权。`getFeedbackTaskAccess` 和任务汇总都只接受 `actorProvider` 取出的可信 actor，且每次调用重新读取；所有上述写能力恒为 false。

## 测试与反例

[`tests/governance/feedback-contracts.test.cjs`](../../../tests/governance/feedback-contracts.test.cjs) 共 **11/11** 通过，覆盖：

1. 合同纯依赖扫描，以及普通动态/投粮证据类型隔离。
2. 缺失或不完整策略 fail-closed。
3. 订单、动物、小院关联冲突、非法 ID 与 query 字段拒绝。
4. 请求重试与不同 `attemptKey` 的业务键、去重及请求键复用冲突。
5. 删除状态按注入 policy 计数，删除/更正意图不进入写路径。
6. `scheduled`、`pending`、`completed`、`excess`、`overdue` 状态区分并覆盖 maximum 超限。
7. 动态证据读权限与订单/动物/证据写能力隔离。
8. `startsAt`、`expiresAt`、`now` 的窗口前、边界、未来及窗口后计数边界。
9. `withdrawn`、`corrected`、`rejected` 状态的显式计数策略。
10. 缺少可信 `actorProvider`、actor 切换及 provider 每次重读。
11. 超大时间戳、保留字段空值/null、未知字段 fail-closed。

本地复验：

```text
node --test tests/governance/feedback-contracts.test.cjs  # 11/11 PASS
node --check navigation/feedbackContracts.ts              # PASS
git diff --check -- navigation/feedbackContracts.ts tests/governance/feedback-contracts.test.cjs  # PASS
```

## 验收边界与后续接入

本子批只完成 A07 的输入、业务键、策略、只读计数和反例合同，**不代表 G-FEEDBACK 业务链路完成**。尚未接入 `feedingOrderMockApi`、动态发布/编辑、订单详情、反馈任务列表、rescue/adoption adapter、任何 storage 或真实后端；未修改页面、路由、package scripts、lockfile、native baseline，也未启动 DevTools、执行真实投喂/发布/删除/更正或提交。

后续 G-FEEDBACK adapter 必须先由产品/设计确认：策略版本的来源、反馈窗口与最大次数、删除/撤回/更正后的证据留存和计数规则、跨院订单的合法参与者，以及任务完成后的页面落点。接入时必须从可信订单、动物、小院和 actor 记录重读并调用本合同；动态载体的真实存在、当前 actor 归属、删除 tombstone/更正版本也必须由 adapter 重读确认，合同不会猜测动态数据模型。之后再补 C5/C8 的页面、返回刷新、非本人零写入、旧数据兼容、build/package 与运行时证据；不能把前端隐藏按钮或 query 参数当作权限。
