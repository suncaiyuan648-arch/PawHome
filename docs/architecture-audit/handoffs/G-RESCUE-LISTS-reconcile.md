# G-RESCUE-LISTS 合同归一交接

日期：2026-09-16。范围仅为救助列表只读合同的归一；未修改页面、路由、`rescueStorage`、UI 或真实业务写入。

## 结论

唯一 canonical 是 [`navigation/rescueListContract.js`](../../../navigation/rescueListContract.js)。它已经被 G-RESCUE-LISTS 的测试与台账引用，保持纯函数边界：调用方注入已读取记录或同步 resolver，合同重新解析可信 actor，只输出冻结的 `rescue.mine` 与 `rescue.review.list` 读模型。

本轮审计发现以下两个未采用的中间产物没有源码引用、测试引用或构建入口，且不在 Git 索引中，已安全删除：

- `navigation/rescueListContracts.js`
- `packages/rescue/services/listsContract.js`

它们的 API、状态语义和归属校验与 canonical 不一致：前者额外引入任务合同并允许另一套任务字段，后者把 adapter 绑定、任务摘要和救助列表合同混在同一服务中。保留它们会让后续 coder 无法判断应实现哪一份合同，也可能再次把基金/评审状态轴混用。

## 后续迁移策略

W2b adapter 只依赖 canonical：先由救助域读取并筛选拥有明确业务含义的记录，再调用 `readRescueMine` 或 `readRescueReviewList`；传入当前可信 actor provider 和域内 resolver/records。adapter 不得从被删路径恢复第二份规范，不得把公开基金、证实、投票或领养集合直接当作 `rescue.mine`，也不得用 query、`managed`、显示角色或 funding 状态推断访问权。

需要任务摘要时由 G-TASKS 的独立合同负责聚合，不能通过复制列表合同解决。需要接入 `rescueStorage` 时由 C1 在 adapter 批次中完成字段映射、状态轴验证、`rescueId`/`reviewItemId` 深链和返回刷新；本交接不预先改动这些调用方。

## 本轮 canonical 复验

- `reviewStatus`、`voteStatus` 等显式 `null` 值不会被另一个别名绕过；`undefined` 仅按现有兼容记录视为缺失。
- 新增跨域 `businessType: adoption` 反例；记录域别名不一致时 fail-closed。
- `node --test tests/governance/rescue-list-contract.test.cjs`：13/13 PASS。
- `node --check navigation/rescueListContract.js`：PASS。
- `git diff --check`：PASS。

当前交付仍是合同子批，不代表救助个人列表/评审列表页面、storage adapter、路由注册或运行时 UI 已完成；这些按 [G-RESCUE-LISTS 计划](../11-采纳建议治理增补计划.md) 进入后续 W2b。
