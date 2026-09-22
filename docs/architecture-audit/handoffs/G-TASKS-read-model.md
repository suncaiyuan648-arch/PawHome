# G-TASKS / A03 只读聚合子批交接

## 范围

本子批只冻结跨域 task read-model 合同，供后续 `account.tasks` 聚合入口和既有评审队列消费。新增 [`navigation/taskReadModel.js`](../../../navigation/taskReadModel.js) 只接收调用方注入的 trusted actor provider 与四个域 resolver：`adoption`、`rescue`、`feeding`、`dynamic`。

resolver 每次读取只收到新解析出的 `{ actor }`，不能从 query、路由、URL 或页面状态生成身份；必须返回本域 task candidate 数组。模块使用 [`navigation/taskContracts.js`](../../../navigation/taskContracts.js) 规范化摘要，强制 resolver 域与 `businessType` 一致、`actorId` 与当前 actor 一致，并跳过未知字段、未知状态/角色、URL、别名字段、跨域 ID、异步 resolver、异常 resolver 和错误返回。

## 读取与去重语义

- 输出只有冻结的 `all`、`pending`、`processed` 摘要，保留 `taskId/businessType/businessId/actorId/actorRole/actionType/status/reviewItemId`；不输出路由或 URL。
- `taskId` 按对象、阶段、处理 actor 去重，actorRole 与 status 不参与身份；同一人跨角色不会按展示角色拆出重复任务，其他对象/阶段任务仍全部保留。
- 同一 task 的重复刷新保留已处理状态；同一 task 的 `reviewItemId` 冲突则整组丢弃并在 diagnostics 明确记为 `DUPLICATE_CONFLICT`，避免把错误业务落点交给详情页。
- `actorRole` 与 `status` 仅为展示元数据，不能授权写入；当前模块没有任何写 API、storage import 或写回回调。
- trusted actor 缺失/提供器异常时整体 fail-closed，resolver 不调用；单域 resolver 失败时明确 skip，健康域仍可生成只读摘要。

## 验收证据

`tests/governance/task-read-model.test.cjs` 覆盖四域聚合、同人多角色、重复刷新、已处理保留、伪造角色/状态不提权、跨域/URL/query/别名拒绝、resolver 失败/异步返回/错误结果、冲突落点、actor 缺失与身份切换。子批测试：`8/8 pass`。

## 集成边界

此交付为 `CONTRACT_SUB_BATCH_COMPLETE`。未注册 `account.tasks`，未修改 `pages.json`、页面、storage 或现有评审队列；聚合列表 UI、深链分发、域内 resolver 的真实接入、运行时和 Figma 视觉验收仍由后续 W2b/W4a/C9 批次完成，不能将 A03 或 G-TASKS 标记为完整 DONE。
