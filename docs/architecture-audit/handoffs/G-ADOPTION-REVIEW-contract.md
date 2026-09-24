# G-ADOPTION-REVIEW / C2 领养审核列表与详情合同交接

> 2026-09-16，W2b contract-only 子批。执行：Luna / xhigh coder；总工复核边界由 `/root` 串行验收。本交接只冻结读模型与反例，不代表页面、路由、storage 或真实鉴权已经接入。

## 交付范围

新增：

- `navigation/adoptionReviewContract.ts`
- `tests/governance/adoption-review-contract.test.cjs`

合同导出 `readAdoptionReviewList` / `getAdoptionReviewList` 与 `readAdoptionReviewDetail` / `getAdoptionReviewDetail`。调用方注入已经从领养域读取的记录，或注入 resolver；合同不 import Vue、uni-app、页面、分包、storage、mock、network，也没有写 API。

## 冻结语义

- 记录必须显式带 `applicationType: 'adoption'` 或 `businessType: 'adoption'`；两者同时存在时必须一致。`review` metadata 也必须保持 adoption 域。
- `applicationId` 与 `reviewItemId` 必须显式存在、是受限 opaque ID，拒绝 URL、路径、跨域前缀（`rescue`、`feeding`、`order`、`dynamic`、`yard`、`animal`）和跨层别名冲突。`review.applicationId` 与记录的 ID 只允许一致；review item 不从 applicationId 拼接或从 query 猜测。合同详情入口严格要求真实 `reviewItemId`；现有 `adoption.review.detail` 路由当前只携带 `applicationId`，adapter 必须先按 applicationId 精确解析唯一 review item，再把真实 reviewItemId 注入合同；缺失、越域或多条歧义时返回 `MISSING_ID`/空态，不能回落首条样本。
- 领养申请生命周期 `status`/`applicationStatus`（两种字段若同时存在必须一致）与审核决定 `review.status` 是两条轴。审核阶段只能是 `cloud_parent`、`owner`、`owner_confirmation`、`jury`；审核状态只能是 `pending`、`approved`、`rejected`。列表的 `pending` / `processed` 和状态过滤只由这条审核状态白名单派生，顶层 application 状态不会伪造已审核；旧 `cloud_rejected` 仍只作为云家长拒绝阶段的生命周期状态。
- 阶段与 application status 的组合显式校验：云家长审核对应 `cloud_pending → pending/rejected/cloud_rejected`；院主审核对应 `pending → pickup/rejected`；院主确认通过只进入 `jury_confirm` / `jury_confirm_pending`，不能直接进入 `adoption_confirmed`；评审团通过才可进入 `adoption_confirmed` / reward 后续状态。拒绝记录必须带对应 `failureStage`。
- 审核关系由可信 actor 和记录关系共同决定：申请人只能通过 `applicantId` / `applicantUserId` 读取自己的详情；院主必须匹配 owner 关系；云家长必须匹配 cloud-parent 关系；评审团必须匹配 `reviewerId` / `reviewerIds`。`reviewerRole` 必须与 phase 一致。列表仅面向审核角色，申请人不会因 query 进入审核队列。
- `query`、`role`、`managed`、`status`、`reviewerId` 只可作为迁移兼容输入或定位意图，不参与身份、归属、阶段或审核决定。详情 resolver 仅收到可信 actor 和经合同校验过的定位 ID。
- 云家长条件复用 `adoptionConditionContract`：0 个沿用 skip，1 个只读现有明确关联/审批，多于 1 个没有注入批准 policy 时返回 `decision_required`；合同不替产品选择 `any`、`all` 或 `specific`。非法 policy/记录 fail-closed。
- 同一 `reviewItemId` 的相同快照在刷新时只保留一条；同 ID 内容冲突时删除该 key 的全部结果并记录诊断。跨域、缺 ID、非法阶段/状态、关系不匹配、resolver 抛错或异步 resolver 均返回空读模型并带诊断。
- 返回项、pending/processed 桶、诊断和 cloud-parent 快照均冻结；所有结果明确 `readOnly: true`、`canWrite: false`。本合同不执行写入、不开放审核动作、不改变现有 `ADOPTION_TRANSITIONS`。

## 反例测试

`node --test tests/governance/adoption-review-contract.test.cjs`：**15/15 PASS**。

测试覆盖：

1. 纯度、公开导出和无写 API；
2. trusted owner 关系及 query role/managed/status 忽略；
3. 四阶段与 owner/cloud-parent/reviewer 关系；
4. reviewerIds-only 及 reviewerId/reviewerIds、owner/cloud alias 冲突；
5. application/review ID opaque、跨域前缀和 applicationType/businessType 隔离；
6. application status 不得替代 review status；
7. pending/processed 派生与 status filter；
8. 0/1/多云家长，显式 policy 才提供选择，不默认 any/all；
9. 院主确认通过必须先进入 jury，不能跳到 adoption_confirmed；
10. 现有 `jury_confirm` rejected failure stage 与 applicationId-only 路由的 `MISSING_ID`；
11. 申请人只能读取自己的申请详情；
12. reviewItemId 与 applicationId 一致性；
13. 相同重复去重、冲突记录 fail-closed；
14. resolver 只收 trusted actor，异步/错误结果为空；
15. 读模型冻结和零写能力。

## 总工验收边界

本子批通过后，C2 adapter 仍需：

- 仅从 `utils/adoptionStorage.ts` 读取，并把旧 `id/recordId` 显式映射为 `applicationId`；不得把公开样本直接喂给私密审核列表；
- 为现有审核 mock 的 owner/cloud-parent/jury 配置生成含 `reviewItemId`、`phase`、`reviewerRole`、`reviewerId`、`review.status` 的真实 metadata；不得用页面 query 补齐这些字段；
- 重读当前申请 status、云家长条件和 reviewer 能力后再进入列表/详情页面；写动作另走状态转换和 capability adapter；
- 继续保留补材料/重新审批关闭决策（`ADOPTION_REAPPROVAL_ENABLED=false`）；院主确认不能绕过评审团；
- 为 adapter/UI 批次补充旧链接、返回刷新、跨角色、运行时和 Figma 六项证据。当前合同子批只验收 focused test、静态门禁和构建边界，不宣称 runtime/UI PASS。

## 局部验证

```text
node --test tests/governance/adoption-review-contract.test.cjs  # 15/15 PASS
node --check navigation/adoptionReviewContract.ts                # PASS
git diff --check                                                  # PASS
```

未暂存、未提交、未上传；没有页面、路由、storage、mock、包配置或真实业务写入变更。
