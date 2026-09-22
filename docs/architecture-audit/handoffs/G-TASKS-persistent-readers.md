# G-TASKS persistent domain readers

日期：2026-09-19

`packages/feeding/services/taskReader.js` 和 `packages/dynamic/services/taskReader.js` 已绑定 `PAWHOME_FEEDING_ORDERS`、`PAWHOME_DYNAMIC_RECORDS` 持久 key，按可信 actor 读取 donor/院主或动态作者任务；缺 key、坏 JSON、非法 ID 和 actor 不一致均返回明确诊断并保持只读。

`packages/account/services/tasksRuntime.js` 在 account 分包内复用同一字段语义，避免把完整 root adapter 拉回 1.5 MiB 主包；account.tasks 聚合页因此可同时展示 adoption/rescue 以及 feeding/dynamic 的本地持久摘要。页面没有写动作，未接入的业务详情显示“详情待接入”。

验证：`tests/governance/persistent-domain-task-readers.test.cjs` 3/3、`tests/governance/account-tasks-runtime.test.cjs` 4/4；包体 final 以最新构建报告为准。

## 2026-09-19 路径复验修订

原交接中的 `packages/dynamic/services/taskReader.js` 是迁移前路径。当前唯一实际绑定入口是
[`packages/account/services/tasksRuntime.js`](../../../packages/account/services/tasksRuntime.js)，它在现有 account 分包内读取四个持久 key，并把 feeding/dynamic 摘要加入同一聚合模型；`packages/feeding/services/taskReader.js` 保留为投喂域的独立 reader。没有重新创建未注册的 `packages/dynamic` 顶层根，避免产生幽灵分包和包体归属歧义。

更新后的 `persistent-domain-task-readers.test.cjs` 以现有 feeding reader 和 account runtime 验证动态摘要；`account-tasks-runtime.test.cjs` 继续覆盖四域 actor scope、坏存储和零写入。全量治理当前 **323/323 PASS**，`account.tasks` 的 feeding/dynamic 详情目标已由 package-local `taskPageModel` 映射到受保护的订单/动态详情壳。
