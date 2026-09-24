# G-TASKS / A03 任务摘要合同交接

taskId: G-TASKS-A03  
owner: Luna  
baseCommit: 工作区当前基线（未提交）  
implementedCommit: 未提交（按任务要求交由总工验收）

## 范围

本子批是 **contract-only**，只新增纯 JavaScript 合同与反例测试：

- `navigation/taskContracts.ts`
- `tests/governance/task-contracts.test.cjs`
- 本交接文档

没有修改 `pages.tson`、业务页面、`routeContracts`、`legacyRoutes`、actor 模块、storage、package scripts、package-lock、native baseline、设计文件或业务状态，也没有新增路由、DevTools 运行、真实 storage 写入、提交、暂存、上传或发布。

## 合同接口

`navigation/taskContracts.ts` 不依赖 Vue、uni-app、页面、分包、storage 或业务服务，导出：

- `normalizeTaskSummary` / `createTaskSummary`：校验并规范化冻结的任务摘要。
- `taskIdFor`：按 `businessType + businessId + actionType（阶段） + actorId` 生成确定性唯一键；`actorRole` 与 `status` 不参与键计算。
- `dedupeTaskSummaries`：按 taskId 去重；同一任务刷新时只保留一个摘要，已处理状态不会被后续 pending 刷新覆盖。
- `getTaskState` / `isTaskProcessed`：将展示状态映射为待处理或已处理，不改变业务状态。
- `getTaskAccess` / `canReadTaskSummary`：只按可信 actor 的 `id`（兼容适配用 `actorId`）判断摘要可读性，角色与状态不授予访问能力。
- `canWriteTaskSummary`：恒为 `false`；该模块没有任务写入 API。

摘要要求以下字段：

```text
taskId, businessType, businessId, actorId, actorRole, actionType, status
```

`reviewItemId` 仅允许 adoption/rescue 域。业务类型固定为 `adoption | rescue | feeding | dynamic`；角色、动作阶段和状态均为各自白名单。`businessId` 与 `reviewItemId` 只接受受限不透明 ID，不接受 URL、路径、空值、控制字符、原型键、未知字段或域别名。明显以其他域前缀开头的业务 ID、feeding/dynamic 携带 `reviewItemId`、冲突 taskId 均 fail-closed。

`actorRole` 与 `status` 是列表展示元数据。可信 actor 的身份来自 G-ACTOR 会话提供器；任务摘要中的角色、状态和任意 query/message 字段都不能用来推导写权限。已处理摘要仍保留 `businessType`、`businessId` 和 `reviewItemId`，供只读详情落点继续使用。

## 反例验证

```text
node --test tests/governance/task-contracts.test.cjs
7 passed, 0 failed
```

覆盖：

- 同一 actor 在多个业务域、多个对象/阶段和多个展示角色下的任务不丢失；角色变化不改变对象/阶段/actor 身份键。
- 重复刷新只产生一个 task；已处理摘要仍可读，业务落点和 reviewItemId 保留。
- 伪造角色、修改状态不会改变 taskId，也不会产生写能力。
- taskId 的确定性以及 actor、对象、阶段、业务域隔离。
- 未知类型、未知状态/动作、空 ID、URL/path、原型键、未知域字段、域别名、明显跨域 ID、feeding/dynamic 的 reviewItemId、伪造 taskId 均失败且不读取/写入任何业务存储。
- 摘要冻结、未知写回 callback 拒绝、`canWriteTaskSummary` 恒为 false；测试用 spy 证明合同无写入回调路径。

另行通过：

```text
git diff --check
```

## 验收边界

本交接只冻结任务摘要的纯读模型合同，不代表待办列表、`account.tasks` 路由、消息/任务深链、各业务 resolver、G-ACTOR 接入或审核/订单/反馈写入已经实现。taskId 的业务对象真实性、actor 身份真实性、业务记录存在性与详情访问能力必须由后续域服务在读取时重新校验；本模块不信任 task 摘要授予任何业务 capability。

`A03/11` 仍为未整体完成状态，后续需要在 C0-C/C6 任务聚合与域内接入批次中继续验收同人多角色、待处理→已处理、失效深链和返回刷新。

## 六项状态

```text
BUILD: NOT RUN（纯合同子批，未启动小程序构建）
RUNTIME: NOT RUN（未启动 DevTools）
CONSOLE: NOT RUN
INTERACTION: NOT RUN
GEOMETRY: NOT RUN
VISUAL: NOT RUN
```

