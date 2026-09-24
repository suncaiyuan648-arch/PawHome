# G-RESCUE-STATE / A05：救助状态与资金轴合同

日期：2026-09-16  
任务：`G-RESCUE-STATE`，对应 11 增补计划 A05 / `06-全量路由迁移与验收矩阵.md` A05  
执行范围：纯只读状态合同与反例测试  
状态：合同子批已交付；未接入救助审核、基金或评审 UI；未提交、未暂存、未上传、未发布

## 交付结论

新增 `packages/rescue/services/stateContract.ts`，作为救助状态三轴的轻量纯 JS 合同模块。模块无 Vue、uni、页面、路由和 storage 依赖；只接收记录或 JSON，并返回冻结的只读投影。没有状态迁移函数、资金写入函数或普通 actor 的打款能力。

新增 `tests/governance/rescue-state-contract.test.cjs`，覆盖缺失、未知、冲突、旧字段兼容、查询参数伪造和资金权限反例。

## 字段与轴合同

| 轴 | 规范字段 | 合法值 | 兼容读取来源 | 语义 |
| --- | --- | --- | --- | --- |
| 平台审核 | `applicationStatus` | `platform_pending`、`platform_approved`、`platform_rejected` | `application.status` | 申请是否通过平台审核 |
| 审核/投票 | `review.status`（投影同时提供 `reviewStatus` / `voteStatus`） | `pending`、`approved`、`rejected` | `reviewStatus`、`voteStatus`、`vote.status`；旧 `status=pending/rejected` | 评审任务/投票轴 |
| 资金 | `funding.status`（投影同时提供 `fundingStatus`） | `funding_pending`、`funding_failed`、`funding_paid` | `fundingStatus`、`fundingOutcome`；旧 `status=unpaid/paid` | 资金处理结果轴 |

字段字典由 `RESCUE_STATE_FIELD_DICTIONARY` 导出。未知或冲突轴的状态归一化为 `unknown`，并在 `errors` 记录 `UNKNOWN_STATUS` 或 `CONFLICTING_STATUS`；缺字段保持 `unknown`，不从其他轴推断。

`status` 是 `utils/rescueStorage.ts` 的历史复合字段：旧 `pending/rejected` 只读作评审状态，旧 `unpaid/paid` 只读作资金状态。合同绝不使用资金状态改写 `applicationStatus` 或原始 `status`，也不新增 storage key。

## 只读投影与 fail-closed 规则

`readRescueStateProjection`、`normalizeRescueState` 和 `parseRescueState` 都只产生投影/解析结果：

- `platform_approved` 没有资金字段时，`funding.status` 为 `unknown`，`funding.paid` 为 `null`，不会显示已打款。
- 只有明确的 `funding_paid` 才能得到资金轴的 paid 证据，且平台审核已通过、评审结果已通过且无跨轴冲突时才可展示；平台审核通过本身不会派生打款成功。
- `funding_failed` 保留失败状态并可展示失败；它不会被转换成审核失败或其他轴状态。
- 平台审核未通过/未完成、缺少评审结果却出现 `funding_paid`，或评审否决与资金结果冲突时，投影为 `validity: invalid`；资金成功的显示投影降为 `unknown`，不伪造成功。
- 普通 actor 始终得到 `canWriteFunding: false` 和 `canTransitionFunding: false`；该模块没有资金写入/迁移导出。
- `query`、`role`、`outcome` 只属于调用上下文，未进入状态计算，不能改变投影。
- JSON 解析失败和非对象输入分别返回 `INVALID_JSON` / `INVALID_RECORD`，并提供未知状态投影。

## 验证

- `node --test tests/governance/rescue-state-contract.test.cjs`：9/9 PASS。
- `git diff --check`：总工在合并工作区复验 PASS；本子批文件未引入预期外的空白改动。

本子批未运行 BUILD、微信开发者工具、Console、页面交互、几何或视觉验收：

```text
BUILD: NOT RUN
RUNTIME: NOT RUN
CONSOLE: NOT RUN
INTERACTION: NOT RUN
GEOMETRY: NOT RUN
VISUAL: NOT RUN
```

## 限制与后续接入

本合同尚未接入 `rescueStorage.ts`、救助审核详情、基金列表、投票任务或打款 UI；未改变现有救助状态转换，也未开放真实审核、打款或支付。后续 C1/C0 接入时必须在数据读取边界调用本合同，按可信记录读取审核/评审/资金字段，并由独立 actor/capability 合同决定任何写操作；不能把投影中的 `paid` 或 query/role/outcome 当作写权限。

回滚单位为新增合同模块、对应治理测试和本 handoff；不涉及页面、路由、存储迁移或业务数据。
