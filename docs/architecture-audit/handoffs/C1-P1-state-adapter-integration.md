# C1-P1 进度页状态 adapter 尾项交接

taskId: C1-P1-state-adapter-integration  
owner: 总工程师  
status: 已验收合入（只读接入）  
date: 2026-09-18

## 交付范围

- 新增 `packages/rescue/services/progress.js`，作为救助申请者进度页唯一读取入口。
- `packages/rescue/pages/progress/index.vue` 不再直接导入 `rescueStorage`，只向 service 传递路由合同已校验的精确 `rescueId`。
- service 在同一个 `includeDemo:false` 保存快照上调用根 `services/domainReads/rescue/stateContract.js` 的 canonical projection，将 `applicationStatus` 和完整 `rescueState` 投影到页面模型；结果固定 `readOnly:true`、`canWrite:false` 并深冻结。
- 缺失、malformed ID、存储异常和矛盾状态均不产生写入；资金冲突不会被渲染为已打款，demo ID 不会回退到演示记录。

## 数据边界

页面继续由 `decodeWeixinLoadOptions` 一次解码并通过 `buildRoute('rescue.progress', ...)` 校验参数。service 不接受 `status`、`role`、`query` 或外部 record 注入，也不从旧状态推断 actor/capability。`rescueStorage` 对旧 `status` 的兼容归一化仍由 canonical `stateContract` 解释；本尾项没有新增 storage key、状态转换或写 API。

## 验收

- `rescue-progress.test.cjs`：**8/8**；覆盖页面生命周期/空态、精确 ID、一次解码、service canonical 投影、demo 排除、矛盾资金状态和旧聚合 API 依赖反例。
- `npm run test:governance`：**283/283**。
- 页面、路由和既有 UI/native 门禁通过；本批未改变导航、安全区、Figma 节点或公共组件默认值。
- 既有 DevTools 空态/真实记录冒烟证据可沿用 C1-P1 原交接；本次 service-only 尾项没有新增审核、基金、投票或写操作交互，因此不扩大 RUNTIME/INTERACTION/GEOMETRY/VISUAL 结论。

## 未包含

审核列表/详情、基金和投票页面、真实 actor 绑定、资金写入、任务聚合、feeding/dynamic reader 以及新的 Figma 专属状态仍按 08/11 台账待后续批次治理。正式打款、上传、发布和真实救助提交均未执行。
