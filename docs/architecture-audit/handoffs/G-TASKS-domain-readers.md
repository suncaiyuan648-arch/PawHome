# G-TASKS/A03 四域真实 task reader 绑定交接

日期：2026-09-16  
交付范围：W4a 任务聚合前置的 domain reader 子批  
状态：adoption/rescue reader 已接入；feeding/dynamic 保持显式 `READER_MISSING`；任务页面、深链和交互仍未接入

## 交付内容

新增 [`packages/account/services/domainTaskReaders.js`](../../../packages/account/services/domainTaskReaders.js)，导出 `createDomainTaskReaders()`（以及 `getDomainTaskReaders`、`buildDomainTaskReaders` 别名），可直接作为 `readAccountTasks({ readers })` 的四域 reader 配置。

- adoption：通过安全 `getAdoptionRecords({ includeDemo: false })` 找到候选 ID，再逐条复用 `readAdoptionApplication`。只有明确 `applicantId`/`applicantUserId` 关系的可信 applicant 才能进入申请任务；评审任务复用 `readAdoptionReviewList`，要求 canonical review relation/status/reviewItemId。
- rescue：复用 `readRescueMine`、`readRescueReviewList`，申请状态再由 `readRescueStateById(..., { includeDemo: false })` 的 canonical 三轴状态确认；本人申请和明确 reviewer 评审分别产出 task summary。
- feeding、dynamic：当前没有已批准的安全持久 task source，reader 返回只读失败 envelope，`taskAdapter` diagnostics 明确记录 `READER_MISSING`；没有 demo、fixture、首条记录或 ID 推导 fallback。

所有 reader 只接受 task adapter 传入的冻结 `{ actor }`，会拒绝额外 context、未冻结 context、query、显示 role 或 status 注入。任务摘要统一通过 `createTaskSummary` 生成，显式提供 `businessType/businessId/actorId/actorRole/actionType/status`，审核任务带 `reviewItemId`。业务状态到任务展示状态的映射是本文件内固定白名单：未知 adoption/rescue 状态跳过并产生 diagnostic，绝不把未知值猜成 pending/processed。

## 失败与只读边界

`includeDemo:false` 在各域 reader 中固定；旧 adoption 记录没有 applicant 关系时只返回空，不从 `applicantName`、`ownerName`、query 或角色文本推断 actor。跨用户、跨域、跨 ID、关系冲突、状态冲突、malformed record、storage adapter error 和不支持的状态均 fail-closed。读 adapter 的异常、异步 reader、非法 envelope 交由 `taskAdapter/taskReadModel` 记录域诊断，健康域仍可返回任务。

reader 返回的 envelope 深冻结且恒为 `readOnly:true`、`canWrite:false`；本批没有 writer、transition、支付、审核提交、storage schema、页面、路由或深链写入。

## 验证

新增 [`tests/governance/task-domain-readers.test.cjs`](../../../tests/governance/task-domain-readers.test.cjs)，6/6 PASS，覆盖：

1. persisted adoption/rescue reader 进入 canonical task summaries，feeding/dynamic 产生 `READER_MISSING`；
2. adoption/rescue review 关系和 canonical review status；
3. demo、跨用户、malformed application/rescue state fail-closed；
4. reader 只接受冻结 actor context，拒绝 query/额外字段，缺域 envelope 只读；
5. reader 异常/Promise 由 taskAdapter 隔离，零写入；
6. 独立测试 fixture 使用正式 source boundary auditor，证明 task composition、域入口与共享实现均无跨分包或 main→subpackage 依赖。

```text
node --check packages/account/services/domainTaskReaders.js       # PASS
node --test tests/governance/task-domain-readers.test.cjs          # 6/6 PASS
git diff --check                                                   # PASS
```

本子批未改 `pages.json`、页面、路由或 storage schema；已有业务 adapter 入口保持兼容，单一实现提取见下；未打开新 DevTools 窗口，未进行任务页 BUILD/RUNTIME/CONSOLE/INTERACTION/GEOMETRY/VISUAL 验收。后续需由总工安排安全 feeding/dynamic 持久 reader、account.tasks 页面、消息/任务深链生产接入和待处理→已处理运行时证据。

## 分包边界修复（总工复验尾项）

初次生产构建发现 account 分包静态导入 adoption/rescue 分包，source boundary 正确阻止交付。现将以下 canonical 实现提取到根共享层，原 package 路径保留纯 re-export，account task reader 仅引用共享层：

- `services/domainReads/adoption/applicationAdapter.js`
- `services/domainReads/adoption/reviewAdapter.js`
- `services/domainReads/rescue/lists.js`
- `services/domainReads/rescue/stateAdapter.js`
- `services/domainReads/rescue/stateContract.js`

依赖方向为 subpackage→shared→navigation/utils；没有 main→subpackage、cross-subpackage、动态加载绕过或 guard 例外。状态投影、actor/capability、排除 demo、只读结果和失败语义均保持原实现。原 package facade 的运行测试仍从原入口导入，源码约束测试改为检查 canonical 实现。

复验：关联 focused 测试 **45/45**，全量 governance **281/281**；`npm run build:mp-weixin`、`npm run check:package:final`、source/production boundaries、native guard、`git diff --check` 均 PASS。主包 **1,567,897 bytes / 1531.1KiB**，全量 **4,026,608 bytes / 3932.2KiB**，`pages/meMore` **1,263,956 bytes / 1234.3KiB**，距主包 1.5MiB 目标余 **4,967 bytes**；本批尚未接入页面，所以提取没有改变产物字节数。后续页面接入必须重新检查主包预算。
