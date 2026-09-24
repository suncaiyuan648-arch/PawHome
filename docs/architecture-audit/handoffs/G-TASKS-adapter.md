# G-TASKS / A03 跨域 task read adapter 交接

## 交付范围

新增 [`packages/account/services/taskAdapter.ts`](../../../packages/account/services/taskAdapter.ts)，作为 account 待办聚合入口的只读绑定层。它复用 [`navigation/taskContracts.ts`](../../../navigation/taskContracts.ts) 的域、阶段、状态和摘要合同，并通过 [`navigation/taskReadModel.ts`](../../../navigation/taskReadModel.ts) 完成可信 actor 读取、跨域校验、去重、冲突丢弃、状态分桶和异步 resolver 拒绝。

本批没有新增页面、路由、分包、storage key、fixture、写服务或提交入口，也没有复制 adoption、rescue、feeding 的业务数据。适配器只接收调用方已经完成安全读取的 domain reader；reader 的结果必须是 canonical task summary 数组，或包含 `items` 的只读列表 envelope。每条摘要必须显式提供：

```text
businessType, businessId, actorId, actorRole, actionType, status
```

adoption/rescue 的 review 任务还必须由域 reader 显式提供稳定 `reviewItemId`。适配器不会把 `id`、`recordId`、`state`、`role` 或页面 query 猜成业务键，也不会给摘要补域、补 actor 或补 review 落点。

## 读取语义

`readAccountTasks({ actorProvider, readers, query, actorRole, status })` 中只有 `actorProvider` 和 `readers` 参与读取；query、展示角色和状态字段保留为兼容调用形状但完全忽略。每次 read 都通过 `resolveTrustedActor` 取得新的会话快照，reader 只收到冻结的 `{ actor }`。

`createTaskAdapter({ actorProvider, readers })` 返回 `read`、`aggregate` 和恒为 `false` 的 `canWrite`。`read` 与 `aggregate` 每次重新解析 actor 和各 reader，不能复用上一轮 actor 或任务结果。输出深冻结并固定带有：

```text
readOnly: true
canWrite: false
```

适配器没有 submit、mutate、write、storage callback 或 URL 构造能力。

## 失败边界

- 未提供 adoption/rescue/feeding/dynamic reader 时，返回空 `all/pending/processed`，diagnostics 记录 `READER_MISSING`；不会使用 demo、fixture、首条或末条数据填充。
- reader 返回失败 envelope 时返回该域空结果并保留其安全错误码；没有安全持久化证据时应使用失败 envelope 或省略 reader。
- reader 抛异常、返回异步 Promise、返回非数组/非 `items` envelope、暴露 `readOnly:false` 或 `canWrite:true` 时，域被跳过并写入诊断；健康域继续读取。
- task summary 的未知域、别名字段、越域 `businessType`/ID、URL、伪造 actor、query 字段、状态/角色越界以及 `reviewItemId` 冲突由 taskReadModel fail-closed。
- 未知 reader 域在任何 reader 被调用前整体返回空模型和 `UNKNOWN_READER_DOMAIN`；可信 actor 缺失/异常时不调用任何 reader，仅返回 `actorError`。

## 现有域接入边界

本批没有把现有业务 adapter 的原始 record 直接解释成任务。`packages/rescue/services/lists.ts` 当前输出的是救助列表模型，`packages/feeding/services/orderAdapter.ts` 当前包含异步订单读取，adoption 当前只有按 ID 的进度读取；它们都不能未经域内映射直接冒充 canonical task reader。后续接入必须由各域 adapter 在自己的安全边界中：

1. 从真实持久来源读取并排除 demo/fixture；
2. 用可信 actor 做关系筛选，并显式产生 `businessType/businessId/actorId/actionType/status`；
3. 对评审任务显式产生并校验 `reviewItemId`；
4. 将安全的 canonical summaries 交给本适配器，不把 query、显示角色或旧状态传入；
5. 不能提供同步且有安全持久证据的 reader 时，保留空诊断，不增加 fallback。

因此本文件不宣称 account.tasks 页面、真实业务 reader、消息/任务深链或任何审核/订单/反馈写动作已经接通。

## 验收证据

新增 [`tests/governance/task-adapter.test.cjs`](../../../tests/governance/task-adapter.test.cjs)，focused 测试 **9/9**：

- 三域 canonical reader envelope 聚合和深冻结只读结果；
- actor 刷新与 query/actorRole/status 注入忽略；
- 稳定字段、别名、越域 ID、URL、伪造 actor 和 query 字段拒绝；
- taskReadModel 去重、已处理优先及 review 落点冲突；
- reader 异常、异步、非法结果和健康域隔离；
- reader 缺失/无持久证据、未知域、actor 缺失和写能力 envelope fail-closed。

```text
node --test tests/governance/task-adapter.test.cjs
9 passed, 0 failed
```

本批为纯服务合同接入，BUILD、DevTools runtime、console、interaction、geometry、visual 未运行；不因此提升 G-TASKS 完整业务闭环状态。按任务要求未暂存、未提交。
