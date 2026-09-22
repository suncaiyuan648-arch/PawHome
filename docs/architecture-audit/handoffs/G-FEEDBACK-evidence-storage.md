# G-FEEDBACK：反馈证据本地存储尾项交接

日期：2026-09-19  
执行人：治理 coder（feeding/feedback subbatch）  
状态：**STORAGE_SUB_BATCH_COMPLETE**；未暂存、未提交、未上传、未发布

## 交付范围

新增 [`packages/feeding/services/feedbackEvidenceStorage.js`](../../../packages/feeding/services/feedbackEvidenceStorage.js)，作为反馈证据的 append-only 本地 storage seam：

- 唯一 key 为 `PAWHOME_FEEDBACK_EVIDENCE`，根结构必须是数组；JSON、根结构、重复 `evidenceId`、关联或策略错误均 fail-closed，拒绝覆盖原值。
- 读取和追加都要求每次重新解析的可信 `actorProvider` 与显式 feedback policy；只返回当前 actor 的 canonical evidence，支持 `kind`、`dynamicId`、`orderId`、`animalId`、`yardId` 精确过滤。
- 投粮证据由 canonical contract 校验订单、动物、小院三方关联；普通动态证据不会携带订单/动物字段，两个域不会交叉读取。
- 业务键重复追加幂等返回且不重复写入；新的 `attemptKey` 才形成新的合法证据；写入异常不报告成功。
- 仅保留 append/read；没有 delete、withdraw、correct 导出，`mutationIntent` 继续由 `feedbackContracts.js` 拒绝。返回模型保持 `readOnly:true`、`canWrite:false`，不接入真实反馈提交页面。

## 反例证据

[`tests/governance/feedback-evidence-storage.test.cjs`](../../../tests/governance/feedback-evidence-storage.test.cjs) 共 **6/6 PASS**，覆盖：

1. storage seam 不暴露删除/更正 API；
2. actor-scoped canonical read、深冻结与只读能力；
3. 同 attempt 幂等、不同 `attemptKey` 追加；
4. actor 不匹配、删除意图、关联冲突和 storage 写失败；
5. dynamic/feeding kind 与订单/动物/小院精确过滤；
6. malformed storage 不被静默改写，append 零写入。

本批未新增页面、路由、真实后端、支付或真实反馈提交；动态/投粮任务页面、后端同步、删除/更正决策仍由后续批次治理。补材料/重审保持关闭。

本地复验：

```text
node --test tests/governance/feedback-evidence-storage.test.cjs  # 6/6 PASS
node --check packages/feeding/services/feedbackEvidenceStorage.js # PASS
git diff --check -- packages/feeding/services/feedbackEvidenceStorage.js tests/governance/feedback-evidence-storage.test.cjs # PASS
```
