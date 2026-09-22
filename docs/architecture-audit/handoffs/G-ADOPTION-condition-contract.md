# G-ADOPTION/A02 条件分支合同交接

日期：2026-09-16  
交付者：Luna（xhigh）  
验收层级：W2a contract-only 子批

## 交付范围

新增 [`navigation/adoptionConditionContract.js`](../../../navigation/adoptionConditionContract.js)。该文件是纯 JavaScript 合同，不依赖 Vue、uni-app、页面、分包、storage、mock、网络或现有业务服务，也不提供写入函数。

合同由调用方注入真实的状态转换边界和必要的云家长评审解析器：

- `createAdoptionTransitionContract(transitions)` 只冻结调用方传入的转换表快照，不复制 `ADOPTION_TRANSITIONS`，也不创建第二套状态枚举。接入时必须传入 `utils/adoptionStorage.js` 的 `ADOPTION_TRANSITIONS`，或由等价 adapter 暴露其 `canTransition` 语义。
- `evaluateCloudParentCondition({ record, policy, reviewResolver })` 读取 `cloudParentIds`/`cloudParentPawId` 与现有 `cloudParentApprovals`。0 个云家长返回 `skip` 并允许继续；1 个云家长没有批准时保持 `pending`，只有现有批准记录能证明 `approved`。
- `cloudParentRequired` 必须与权威 ID 集合一致：`false + 有 ID`、`true + 无 ID`、非布尔值和单/列表 ID 冲突都返回 `decision_required`；审批与拒绝列表同时包含同一云家长也 fail-closed。
- 多个云家长没有显式 policy 时返回 `decision_required` 并禁止继续，不猜测全员或任一规则。policy 必须显式提供 `selection: any|all|specific`、完整 `legalStates` 和 pending/approved/rejected 的一一映射；`specific` 还必须提供 `specificIds` 及其 `any|all` 聚合规则。
- `reviewResolver` 只接收冻结的当前记录副本，不接收 query、actor、managed 或 state 覆盖值。缺少 per-parent 状态、状态不在 policy 或 resolver 失败时 fail-closed。
- `resolveAdoptionPerspectives`/`readAdoptionCondition` 只依据可信 actor provider 与记录归属字段判定申请人、云家长、院主视角。query 中的 `role`、`managed`、`state`、ID 或结果不能伪造权限；申请人关系只接受明确的 `applicantId`/`applicantUserId`，不把通用 `userId` 当作私密归属。
- `canEnterAdoption` 只读检查注入转换边界和云家长门槛。当前状态不在真实转换表、云家长未满足审核、或没有转换边界时均拒绝；拒绝/放弃等注入转换表允许的终止边不被云家长审核门槛错误阻塞；院主确认到 `adoption_confirmed` 的直达跳转不会绕过 `jury_confirm`/`jury_confirm_pending` 的真实合法边。
- `readAdoptionCondition` 每次从传入记录读取当前 status，输出 `readOnly: true` 且 `canWrite: false`。旧链接只能显示当前阶段，不会重放 query 中的旧阶段或提交动作。

## 反例测试

新增 [`tests/governance/adoption-condition-contract.test.cjs`](../../../tests/governance/adoption-condition-contract.test.cjs)，共 **13/13** 通过，覆盖：

1. 合同纯依赖扫描、稳定导出和无 writer。
2. 注入转换边界，以及院主确认跳过评审的非法直达边。
3. 可信申请人、云家长、院主归属；伪造 query/role/managed/state 和他人记录均拒绝。
4. 0 个云家长跳过，1 个云家长等待/审核与批准读取。
5. `cloudParentRequired` 与 ID 集合冲突、同一云家长同时批准/拒绝时 fail-closed。
6. 多个云家长缺少 policy 时 `decision_required` 且禁止进入下一阶段。
7. any/all/specific policy 的显式选择、合法状态映射、指定 ID 和聚合结果。
8. resolver 无法接收 query/actor 覆盖；不合法状态和未声明单家长规则 fail-closed。
9. 评审未完成时允许真实转换表中的拒绝/放弃终止边，禁止院主确认直达最终领养。
10. 旧链接重读当前记录阶段，非法 ID、冲突家长 ID、缺少转换边界和坏 actor 均拒绝。

本地复验：

```text
node --test tests/governance/adoption-condition-contract.test.cjs  # 13/13 PASS
node --check navigation/adoptionConditionContract.js              # PASS
git diff --check -- navigation/adoptionConditionContract.js tests/governance/adoption-condition-contract.test.cjs  # PASS
```

## 现有数据限制与 DECISION_REQUIRED

当前 `utils/adoptionStorage.js` 已有 `cloudParentRequired`、`cloudParentIds`、`cloudParentPawId`、`cloudParentApprovals` 和 `ADOPTION_TRANSITIONS`，因此 0/1 家长兼容读取与合法状态边界可由 adapter 接入。

当前记录没有稳定的 `applicantId`/`applicantUserId` 私密归属字段，不能安全地从 `applicantName` 或通用 `userId` 推导申请人视角。接入必须从可信会话和后端/adapter 注入申请人归属；在此之前申请人私密读取保持关闭。

现有多家长数据没有产品批准的 `any`、`all` 或 `specific` 选择，也没有统一的逐家长状态字典。多家长接入必须由产品/后端提供 policy 与 `reviewResolver`，并明确超时、拒绝、撤回等状态的映射；合同不会自行选择规则，当前记为 **DECISION_REQUIRED**。

## 后续边界

本子批没有修改 adoption 页面、路由、`adoptionStorage`、`applicationMockApi`、进度服务、任务列表、组件、分包或 UI；未接入真实 actor、storage adapter、评审列表/详情、申请进度和旧链接恢复，也未执行 DevTools、模拟器、真实提交或发布。

后续 G-ADOPTION adapter 必须先从可信会话重读申请记录，传入真实 `ADOPTION_TRANSITIONS`、明确的 applicant/owner/cloud-parent 归属和已批准的多家长 policy，再补申请成功/等待/院主/评审文案同步、审核列表待处理/已处理、返回刷新、跨用户零写入和 runtime/UI 验收。页面隐藏按钮、query 参数、角色字符串或本地 mock 单用户不能替代这些检查。
