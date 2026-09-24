# G-RESCUE-LISTS/A04 救助个人与评审列表合同交接

日期：2026-09-16  
交付者：Luna（xhigh）+ 总工复验  
验收层级：W2b 前置 contract-only 子批

## 交付范围

新增 [`navigation/rescueListContract.ts`](../../../navigation/rescueListContract.ts)，提供两个只读列表边界：

- `readRescueMine` / `getRescueMine`：只读取当前可信 actor 作为申请人的救助记录。申请人关系只接受明确的 `applicantId`、`applicantUserId` 或 `applicant.id`/`applicant.pawId`；通用 `userId`、查询参数、`managed`、`role` 和 `state` 不会制造归属。
- `readRescueReviewList` / `getRescueReviewList`：只读取当前可信 actor 被明确列入 `reviewerId`/`reviewerIds` 的救助评审记录；每条记录必须同时具备一致的 `rescueId` 与 `reviewItemId`，不能由救助单号推导评审项。

调用方注入已经从领域仓储读取的 `records`，或注入只接收 `{ actor }` 的同步 `resolver`。合同不读取 `rescueStorage`、公开基金/证实列表、页面、路由或 query，也没有写入、投票、审核、打款、删除和更新 API。

## 冻结规则

- 个人申请状态白名单为 `platform_pending`、`platform_approved`、`platform_rejected`；评审状态沿用 A05 的 `pending`、`approved`、`rejected`，旧 `status=unpaid|paid` 只属于 funding 轴，不会进入评审列表。个人列表的 `pending/processed` 由申请状态派生，评审列表的 `pending/processed` 由评审状态派生。
- `rescueId`/`reviewItemId` 使用不透明 ID 校验；URL、路径、跨 adoption/feeding/order/dynamic/yard 前缀、空值、别名冲突和混合域关系 fail-closed。
- 每条记录必须显式声明 `applicationType: 'rescue'` 或 `businessType: 'rescue'`；若两者同时存在必须一致。缺失、领养/动物等其他域值和嵌套评审域值均拒绝，避免公开或跨域记录冒充救助。
- 同一列表刷新以 `rescueId`（个人）或 `rescueId + reviewItemId`（评审）去重；相同快照只保留一份，状态或关系冲突的重复项整组丢弃并记录诊断，不用后一条覆盖前一条。
- 缺少可信 actor、角色不符、resolver 失败/异步返回、记录 malformed、状态未知、他人记录和无审核资格记录均返回空读模型或跳过该项；结果及列表桶冻结，`canWrite` 恒为 `false`。
- 评审记录兼容旧救助存储的顶层 `status`，但评审状态与 `applicationStatus` 分开读取；两轴冲突不会被修复成成功状态。
- 列表摘要只保留标量元数据；对象、数组、非有限数等可变或异常值直接跳过，避免把注入记录的可变引用暴露给页面。

## 反例测试

[`tests/governance/rescue-list-contract.test.cjs`](../../../tests/governance/rescue-list-contract.test.cjs) 共 **13/13 PASS**，覆盖：

1. 纯依赖与无写 API；
2. 可信申请人关系、query/role/managed/state 伪造和通用 `userId` 拒绝；
3. 申请人角色、状态白名单、筛选和 pending/processed 派生；
4. 刷新重复幂等与冲突重复 fail-closed；
5. 评审角色、reviewer 关系、`rescueId`/`reviewItemId` 完整性和状态白名单；
6. 不从 `rescueId` 推导评审项，跨域 ID、别名和嵌套关系冲突拒绝；
7. 明确 `applicationType/businessType=rescue` 域标识，拒绝领养/动物等跨域记录；
8. A05 的 `reviewStatus=pending|approved|rejected` 与 `status=unpaid|paid` 资金兼容值隔离；资金-only 记录不能冒充评审结果；
9. resolver 只收到可信 actor，异步/异常 resolver 明确为空；
10. actor provider 每次重读，结果列表不可写。

本地复验：

```text
node --test tests/governance/rescue-list-contract.test.cjs  # 13/13 PASS
node --check navigation/rescueListContract.ts                # PASS
git diff --check                                             # PASS
```

## 后续 adapter 边界

接入 C1/C0 时必须由领域 adapter 先从可信会话重新读取 actor，再从 `utils/rescueStorage.ts` 精确读取真实记录；不能把 `getRescueRecords()` 的公开 demo、基金池统计、proofList 或评审静态样例直接喂给 `rescue.mine`。adapter 必须明确把领域记录投影为申请人关系或评审资格，检查真实 `reviewItemId`、状态轴、院主/评审授权及 tombstone/版本，然后再交给本合同。

`rescue.mine` 与 `rescue.review.list` 是列表读模型，不能替代已有 `rescue.detail`、`rescue.progress`、`rescue.review.detail`，也不注册新路由。待后续页面/路由批次具备精确 Figma 节点和批准组件后，才可接入列表 UI、待处理→已处理刷新、详情返回和 DevTools 六项运行验收。

本子批未修改 `pages.tson`、页面、storage、mock、package scripts、lockfile、包预算或 native UI 基线；未执行真实救助申请、证实、投票、审核、打款、上传或发布，也未暂存/提交。
