# G-TASKS / A03 `account.tasks` 聚合页子批

状态：`PAGE_SUB_BATCH_COMPLETE`（只读聚合页；未宣称完整 G-TASKS 闭环）

## 本批交付

- 在 [`packages/account/pages/tasks/index.vue`](../../../packages/account/pages/tasks/index.vue) 注册 `account.tasks` 页面，放入独立 `packages/account` 分包，避免把任务列表 UI 和首屏主包混在一起。
- 页面仅通过 [`createTaskAdapter`](../../../packages/account/services/taskAdapter.js) + [`createDomainTaskReaders`](../../../packages/account/services/domainTaskReaders.js) 读取四域任务；每次 `onShow` 重新读取 actor 和业务快照，输出待处理/已处理两个只读桶。
- actor 只从显式 `PAWHOME_ACTOR_SESSION` 会话信封进入 [`resolveTrustedActor`](../../../navigation/actorCapabilities.js)，没有可信会话时显示 fail-closed 空态；登录标记、query、角色文案和 task 摘要都不能生成 actor。
- [`taskPageModel.js`](../../../packages/account/services/taskPageModel.js) 只做显示文案和已注册详情目标映射。领养 `apply/confirm/claim_reward` 与救助 `apply/fund` 可跳到已注册的进度页；审核、投喂、动态任务显示“详情待接入”，不拼接伪造路径或业务 ID。
- `account.tasks` canonical route 已加入 [`navigation/routeContracts.js`](../../../navigation/routeContracts.js)，物理页面路径为 `/packages/account/pages/tasks/index`。

## 边界与状态

- adoption/rescue reader 继续通过根共享 `services/domainReads` 读取；account 分包不依赖另一个业务分包。
- feeding/dynamic 现在从 package-local runtime 读取 `PAWHOME_REWARD_ORDERS`、`PAWHOME_FEEDING_ORDERS`、`PAWHOME_DYNAMIC_RECORDS` 的当前 actor 摘要；key/记录缺失时仍返回 `READER_MISSING`，不用 demo、首条记录或 query 回退。
- 页面没有 storage 写、业务写、支付、审核、反馈、补材料或重审能力；补材料/重审保持关闭。
- 消息生产和任务深链 eventChannel/真实 resolver 仍由 G-DEEPLINK 后续批次负责；本页只允许已注册、已存在的进度页目标。

## 2026-09-19 总工复验补充

页面已按包体预算修正为 package-local runtime：`packages/account/services/tasksRuntime.js` 不把根主包订单 adapter 引入 account 分包；adoption/rescue 的 canonical readers 仍经根 `services/domainReads` 只读接入。页面在用户手动打开的 DevTools 窗口从“我的”抽屉进入，截图显示“任务中心 / 只展示当前账号可读取的业务任务”，无可信登录会话时显示空态和“去登录”按钮；未触发登录、写操作或真实任务提交。

最新静态/构建验收：`npm run test:governance` **318/318**、`npm run check:routes` **73/73**、`npm run check:figma-map` **45 formal states**、`npm run check:ui` / native guard PASS、生产构建与 `npm run check:package:final` PASS。最终主包 **1,572,700 bytes / 1535.8 KiB**，距 1.5 MiB 目标余 **164 bytes**；`packages/account` **18,880 bytes**。后续任何主包依赖、路由字段或共享组件修改必须先做包体预审。

feeding/dynamic 有任务 fixture 时的正向卡片、详情跳转、正式 session provider、消息生产/eventChannel 深链和精确 Figma 几何视觉对比仍未运行；补材料/重审继续关闭。

## 验证

- `node --test tests/governance/task-page.test.cjs tests/governance/route-contracts.test.cjs tests/governance/task-domain-readers.test.cjs tests/governance/task-adapter.test.cjs`：**37/37**。
- `npm run check:routes`：**73 registered / 73 source pages**。
- `npm run check:boundaries -- --source .`：production/source **PASS**。
- 生产构建成功；最终合并包体主包 **1,572,700 bytes / 1535.8 KiB**、`packages/account` **18,880 bytes / 18.4 KiB**、全量 **4,092,290 bytes / 3996.4 KiB**，final 包体门禁通过。
- 本批已补录 DevTools 页面可达性与空态截图；正向任务样本、详情交互、几何测量和精确 Figma 像素比对仍未运行。

## 后续阻塞

1. 接入正式平台 session/actor provider，替换或确认 `PAWHOME_ACTOR_SESSION` 的生产来源。
2. feeding/dynamic 提供域内持久 task reader 后，补充页面真实任务样本和深链目标。
3. adoption/rescue 审核详情页注册并接入真实 resolver 后，开放审核任务详情目标。
4. 总工完成消息生产、任务深链、DevTools 和 Figma 状态复验，并在全量构建后重新执行 `check:package:final`。


## 2026-09-19 最新总工复验

本批状态由 `PAGE_SUB_BATCH_COMPLETE` 维持，但 package-local runtime 已包含四个持久 key 的 actor-scoped 摘要读取；当前 DevTools 已从个人抽屉进入 `packages/account/pages/tasks/index`，可见“任务中心 / 待处理 / 已处理 / 当前账号还没有可验证的身份信息”。重新编译后的 Console 无 app error；清空后 Errors 0 / Warnings 0。

最新 final 产物为主包 **1,572,707 bytes / 1535.8KiB**、`packages/account` **18,880 bytes / 18.4KiB**、全量 **4,092,297 bytes / 3996.4KiB**，final 包体门禁通过。feeding/dynamic 正向任务 fixture、详情路由和消息 eventChannel 仍未接入；未登录空态不代表正向业务样本已验收，补材料/重审继续关闭。

## 2026-09-19 最新收口

`tasksRuntime.js` 已从四个持久 key 读取 actor-scoped 摘要，`taskPageModel.js` 允许 feeding
任务进入 `feeding.order.detail`，dynamic 任务进入受保护的 `dynamic.detail` shell；详情在
缺少当前记录时仍显示不可用态，不执行写动作。`persistent-domain-task-readers.test.cjs` 已更新
为验证现有 `packages/feeding` reader + account runtime，未重新创建未注册的 dynamic 顶层分包。

当前全量治理 **323/323**、路由 **78/78**、Figma **45 formal states**、final 包体门禁通过；主包
**1,572,828 bytes**，余 **36 bytes**。DevTools 已复验任务、审核、基金、通知、动态深链和
订单安全态截图；feeding/dynamic 正向 fixture、真实后端 session 和逐状态 Figma 几何仍未宣称完成。
