# G-FEEDBACK-adapter：反馈任务只读 adapter 子批

日期：2026-09-16<br>
执行人：治理 coder（Luna / xhigh）<br>
范围：`packages/feeding/services/feedbackAdapter.ts`、反馈治理 focused tests<br>
状态：待总工程师验收；未暂存、未提交、未上传、未发布

## 交付结论

本批新增反馈任务只读 adapter，统一复用 `navigation/feedbackContracts.ts` 的 policy、证据、关联、时间窗、计数、幂等和可信 actor 规则。

- `readFeedbackTaskList` / `getFeedbackTaskList`：读取一个明确 `kind`（`dynamic` 或 `feeding_evidence`）下的任务，并以显式 policy 与 `now` 生成任务摘要。
- `readFeedbackTaskDetail` / `getFeedbackTaskDetail`：按 canonical contract 派生的稳定 `taskId` 精确读取，不使用首条、末条、其他用户或其他域任务兜底。
- 投粮任务优先绑定现有只读 `getFeedingOrders` reader，使用可信 actor 形成 mine/yard scope；现有 reader 没有反馈证据存储，因此默认生成空证据任务壳，状态由 policy 正确呈现为 pending。
- 动态任务没有现成持久化 reader，必须由调用方显式提供同步 `reader` seam；缺少 reader 返回 `READER_REQUIRED`，不会使用静态页面或演示数据兜底。
- 外部 `reader` 只收到冻结的 `{ actor, kind, policyVersion, now, perspective, yardId }` 上下文；`records`、`query`、`role`、状态和用户身份参数不会成为数据源或权限依据。
- 所有任务逐条交给 `summarizeFeedbackTask`，因此动态证据与投粮证据严格隔离，订单/动物/小院必须一致，状态和时间窗由显式 policy 决定，重复 request 通过 business key 幂等，删除/更正意图被拒绝。
- 异常、异步 reader、未知字段、未知 kind、错误 policy、malformed ID、跨域字段、actor 不匹配、关联冲突和幂等冲突均 fail-closed；输出为深冻结的 `readOnly: true`、`canWrite: false` 模型。

## 文件与边界

| 文件 | 作用 |
| --- | --- |
| `packages/feeding/services/feedbackAdapter.ts` | 投粮现有 reader 绑定、动态显式 reader seam、task list/detail、只读错误模型 |
| `tests/governance/feedback-adapter.test.cjs` | 8 个 focused 测试，覆盖默认 reader、动态/投粮隔离、精确 taskId 和安全反例 |

没有新增页面、组件、路由、storage key 或 writer；没有修改 `navigation/feedbackContracts.ts`、投粮 reader 或任何业务写入函数。adapter 不接受生产 records 注入，也不接受异步 reader，以免不完整或未验证的结果进入读模型。

## 反例测试覆盖

`node --test tests/governance/feedback-adapter.test.cjs`：**8/8 PASS**。

覆盖内容：

1. 现有投粮 reader 按可信 actor 读取，`records/query/role` 注入不会改变结果。
2. 动态域缺少安全 reader 时 fail-closed，不使用 demo/static fallback。
3. 动态与 `feeding_evidence` 的 kind、订单、动物和小院关系严格隔离。
4. detail 只接受稳定派生 `taskId`，错误 ID 不回退到其他任务。
5. actor 不匹配、订单/动物冲突、跨域字段、删除意图和 requestId 重用均被拒绝。
6. policy 缺失、时间非法、异步 reader 和错误 reader 返回值均返回冻结失败模型。
7. policy 的 required/maximum count、window、状态和证据摘要全部由 canonical contract 计算。
8. 成功与失败返回、任务、列表、诊断均为深冻结，只读且没有写能力。

独立语法和差异检查：

```text
node --check packages/feeding/services/feedbackAdapter.ts
git diff --check
```

结果：均 PASS。

## 总工程师验收边界

本批完成 adapter 子批，不接入页面，也不宣称动态反馈后端 reader 已存在。后续应单独治理：

- 动态详情页和投粮详情页接入对应 `kind`、policy、`now` 和 task detail；
- 建立真实动态/反馈证据持久化 reader，并保留同步或明确的异步边界转换；
- 按业务批准的 policy 处理反馈提交、重复请求、删除、更正和服务端权限；
- 在用户已打开的微信开发者工具中做页面路由、Console、交互、几何和 Figma 视觉验收。

本 handoff 不宣称页面接入、反馈提交、删除/更正动作、UI 验收或真实后端数据已经完成。
