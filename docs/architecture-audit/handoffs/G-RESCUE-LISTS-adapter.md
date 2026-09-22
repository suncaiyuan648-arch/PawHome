# G-RESCUE-LISTS 真实只读 adapter 交接

日期：2026-09-16  
交付范围：G-RESCUE-LISTS/A04 的 storage adapter/read model 子批  
状态：adapter 已完成；页面、路由和运行时仍未接入

## 交付内容

新增 [`packages/rescue/services/lists.js`](../../../packages/rescue/services/lists.js)，提供：

- `readRescueMine(options)` / `getRescueMine(options)`：读取当前可信 actor 作为申请人的救助列表；要求 `applicant` 角色。
- `readRescueReviewList(options)` / `getRescueReviewList(options)`：读取当前可信 actor 被明确列为 reviewer 的救助评审列表；要求 `reviewer` 角色。

adapter 只接受 `actorProvider` 和合同定义的 `filter`。传入的 `records`、`resolver`、`query`、`role`、`managed`、`state` 或 `includeDemo` 不会改变读取边界。每次调用先由 [`navigation/rescueListContract.js`](../../../navigation/rescueListContract.js) 重新解析 trusted actor，随后通过 resolver 重新调用：

```js
getRescueRecords({ includeDemo: false })
```

因此真实边界只有 `utils/rescueStorage.js` 的 `PAWHOME_RESCUES` 已保存记录；不会读取稳定 demo、基金汇总、proofList、juryStorage、领养集合或其他域的 fixture。评审项必须从保存记录中带有明确且一致的 `rescueId`、`reviewItemId`、reviewer 关系和评审状态，adapter 不生成评审 ID 或投票资格。

`rescueStorage` 会为兼容旧记录补齐顶层 `status`。评审读取只在该字段与唯一显式 review/vote 状态完全重复时移除冗余兼容字段；任何不一致仍完整交给 canonical contract 并 fail-closed，避免把冲突修成合法评审。

## 失败与只读边界

可信 actor 缺失、角色不符、storage 读取为空/损坏、记录缺域/缺归属/缺评审元数据、状态未知、越域或别名冲突均由 canonical contract fail-closed：返回空冻结读模型或跳过非法记录。非法 `filter` 仍由 canonical contract 以 `INVALID_STATUS_FILTER` 拒绝，adapter 将该契约失败转换为空冻结读模型，且不会触发 storage 读取。返回模型补充 `readOnly: true`，固定 `canWrite: false`，没有写入、投票、审核、打款、删除或更新入口；列表、桶、摘要和诊断保持冻结。

## 验证

新增 [`tests/governance/rescue-lists-adapter.test.cjs`](../../../tests/governance/rescue-lists-adapter.test.cjs)，5/5 PASS，覆盖：

1. `includeDemo` 强制为 `false`，调用方注入 records/resolver/query 不生效；
2. 当前 actor 申请人归属、身份切换后重新读取、存储快照刷新以及零写入；
3. reviewer 角色、显式 `reviewItemId`/reviewer 关系、本人证实与评审权限隔离，以及兼容状态别名冲突；
4. `readOnly`/`canWrite`、数组和摘要冻结，以及 proof/animals 等详情不泄露；
5. 非法筛选、损坏存储的空读模型与零写入。

本地检查：

```text
node --check packages/rescue/services/lists.js                         # PASS
node --test tests/governance/rescue-lists-adapter.test.cjs              # 5/5 PASS
git diff --check                                                        # PASS
```

本子批未修改 `pages.json`、页面/Vue/UI、路由注册、`rescueStorage.js`、storage schema、package scripts、lockfile、全局导航或任何写操作；未运行 BUILD、微信开发者工具、Console、INTERACTION、GEOMETRY 或 VISUAL 验收。后续仍需由 C1/总工决定真实列表页面、任务聚合和 review metadata 的产品接入方式，并分别取得运行时证据。
