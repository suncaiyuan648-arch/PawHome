# PawHome TypeScript 迁移台账

> 初始生成时间：2026-09-23；整改更新：2026-09-25
>
> 本台账记录当前仓库的 TS 迁移边界、尚未完成项和验收快照。除非对应条目已经完成验证，否则不要将旧 JS 文件删除。

## 1. 总体状态

| 范围 | 当前状态 | 目标 | 台账状态 |
| --- | --- | --- | --- |
| Vue SFC 脚本 | 190/190 使用 `lang="ts"`；其中 189 个为本轮从 Options API JS 迁移，1 个原本已是 TS | 全部 Vue SFC 使用 TS | 已完成 |
| 普通 Vue `<script>` | 0 个 | 0 个 | 已完成 |
| 第一方运行时 JS | 本批 diff 覆盖 97 个业务运行时 `.js`；97/97 已迁移为 `.ts` 并删除旧文件；其中 `navigation + utils + custom-tab-bar` 的 44 个是核心子范围 | 迁移到 TS 并删除旧 JS | 已完成 |
| TS/Vue 对 JS 的依赖 | 初始 107 个；待迁移边界已清零，生产源码不再引用本批次 JS | 生产代码不再依赖待迁移 JS | 已完成 |
| TypeScript 编译边界 | `strict: true`、`allowJs: false`、`checkJs: false` | 关闭 `allowJs` 并由 TS/Vue 编译边界接管 | 已完成 |
| 动态类型债务 | 生产 Vue/TS 源码显式 `any` AST 节点：0 | 禁止新增显式 `any`，以真实模型或 `unknown` 窄化表达 | 已完成（2026-09-23） |
| `unknown` 使用 | 当前 AST 快照：1886 个类型节点，355 个生产 TS/Vue 文件；其中 246 个在 79 个 Vue SFC 脚本中；197 个文件/代码行位置纳入基线 | 原始边界允许 `unknown`；已知业务入参、返回值和内部事件使用具体类型 | TS-R06～TS-R20 已整改；治理测试禁止新增未审查的 `unknown` 类型节点；基线不替代对既有边界合理性的复核 |
| 宽泛响应式数据 | `Record<string, any>`：0；`data()` 宽泛状态：0 个 Vue 文件 | 页面/组件状态采用明确接口，动态输入先收窄 | 已完成（2026-09-23） |
| Props | 业务对象/数组 Props 使用具体接口或元素类型；required/default 冲突、缺省值及 mutating props 扫描均为 0 | Props 复用明确的数据模型并符合默认值规则 | 已完成（2026-09-24） |
| Emits | 57 处数组式声明已转换为带载荷 tuple 的类型契约；本轮发现的父级和页面事件接收函数已对齐载荷类型 | 组件 emit 与父级处理函数保持明确的载荷类型 | TS-R04、TS-R06 已完成 |
| 共享数据/API 契约 | 领养/救助申请主链路及投喂详情、订单可见性和救助审核命令均有具体输入/输出类型；深链解析器返回 `DeepLinkResolution` | 业务 API 的已知输入/输出可由编译器约束 | TS-R01～R03、TS-R07、TS-R08 已完成 |
| 工具回调契约 | actor capability API 和救助审核 reader/writer 使用具体回调上下文与结果签名 | 泛型保留业务对象、回调及返回值类型 | TS-R05、TS-R07 已完成 |
| TS 忽略语 | `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck` 均为 0 | 不新增任何忽略注释 | 已完成 |

## 2. 本批次 JS 文件迁移清单

核心范围按目录统计，`navigation + utils` 初始是 43 个文件；为了闭合运行时 JS 边界，另将 `custom-tab-bar/index.ts` 纳入该子范围，共 44 个。本批 diff 实际还包括包服务、应用入口和 PawIcon 实现；第一方运行时代码合计 97 个 `.js` 模块，现均已迁移并删除旧文件。

状态约定：`待迁移` → `已迁移待验证` → `已验证待删除旧 JS` → `已完成`。

### 2.1 navigation（17/17 已完成）

| 文件 | 当前状态 | 主要工作 |
| --- | --- | --- |
| `navigation/actorCapabilities.ts` | 已迁移已验证 | actor、权限结果接口；保留 fail-closed 行为 |
| `navigation/adoptionConditionContract.ts` | 已迁移已验证 | 领养条件与状态联合类型 |
| `navigation/adoptionReviewContract.ts` | 已迁移已验证 | 领养审核路由/状态契约 |
| `navigation/authContinuationStorage.ts` | 已迁移已验证 | 登录回跳记录与结果类型 |
| `navigation/deeplinkContracts.ts` | 已迁移已验证 | 深链目标、参数白名单与解析结果 |
| `navigation/feedbackContracts.ts` | 已迁移已验证 | 反馈证据/关联契约 |
| `navigation/legacyRoutes.ts` | 已迁移已验证 | 历史路由映射类型 |
| `navigation/managementContracts.ts` | 已迁移已验证 | 管理权限与写入能力类型 |
| `navigation/orderContracts.ts` | 已迁移已验证 | 订单状态和读取契约 |
| `navigation/productionDeepLinkResolver.ts` | 已迁移已验证 | 生产深链解析结果 |
| `navigation/rescueListContract.ts` | 已迁移已验证 | 救助列表筛选、记录契约 |
| `navigation/routeContracts.ts` | 已迁移已验证 | 路由名到参数的映射类型 |
| `navigation/selectorBridge.ts` | 已迁移已验证 | selector bridge 请求/响应类型 |
| `navigation/socialMutationContracts.ts` | 已迁移已验证 | 社交操作授权结果类型 |
| `navigation/taskContracts.ts` | 已迁移已验证 | 任务身份、状态、业务类型 |
| `navigation/taskReadModel.ts` | 已迁移已验证 | 任务只读模型与去重结果 |
| `navigation/weixinLoadOptions.ts` | 已迁移已验证 | 微信 `onLoad` 参数解码类型 |

### 2.2 utils（26/26 已完成）

| 文件 | 当前状态 | 主要工作 |
| --- | --- | --- |
| `utils/addressMock.ts` | 已迁移已验证 | `AddressRecord`、地址簿和默认地址接口 |
| `utils/addressService.ts` | 已迁移已验证 | `AddressRecognitionResult` 与输入收窄 |
| `utils/adoptEntryGate.ts` | 已迁移已验证 | 本地存储入口资格结果 |
| `utils/adoptionPetDisplay.ts` | 已迁移已验证 | `AdoptionPetDisplayRecord` 与头像兜底类型 |
| `utils/adoptionReviewMockApi.ts` | 已迁移已验证 | 领养审核 mock 模型 |
| `utils/adoptionStorage.ts` | 已迁移已验证 | 领养记录、状态、写入结果 |
| `utils/applicationMockApi.ts` | 已迁移已验证 | 领养申请 API 结果 |
| `utils/feedingDemo.ts` | 已迁移已验证 | `FeedingDetailRecord` 与投喂列表演示模型 |
| `utils/feedingOrderMockApi.ts` | 已迁移已验证 | 投喂订单 mock 类型 |
| `utils/juryMock.ts` | 已迁移已验证 | 评审项、投票状态与结果 |
| `utils/juryStorage.ts` | 已迁移已验证 | 评审持久化记录 |
| `utils/locationService.ts` | 已迁移已验证 | `LocationPlace` 与请求/定位结果接口 |
| `utils/memberLevel.ts` | 已迁移已验证 | 等级字典与 `unknown` 输入收窄 |
| `utils/messageUnread.ts` | 已迁移已验证 | `MessageCategory` 与数量结果 |
| `utils/navBack.ts` | 已迁移已验证 | `GoBackSmartOptions` 与递归返回回调 |
| `utils/navLayout.ts` | 已迁移已验证 | 原生导航几何输入/输出接口 |
| `utils/pawNoticeMessages.ts` | 已迁移已验证 | 文案常量字面量类型 |
| `utils/petRosterMockApi.ts` | 已迁移已验证 | `PetRosterData`、`YardPet` 与筛选结果 |
| `utils/profileNav.ts` | 已迁移已验证 | 用户/小院跳转参数接口 |
| `utils/realNameMock.ts` | 已迁移已验证 | 实名状态结果与 `unknown` 输入 |
| `utils/regionMock.ts` | 已迁移已验证 | `RegionNode` 地区树与选择结果 |
| `utils/rescueStorage.ts` | 已迁移已验证 | 救助记录、状态轴、证明结果 |
| `utils/rewardOrderStorage.ts` | 已迁移已验证 | `RewardOrderRecord` 与关联一致性校验 |
| `utils/safeImgSrc.ts` | 已迁移已验证 | 图片地址 `unknown` 输入收窄 |
| `utils/yardDetailStatCopy.ts` | 已迁移已验证 | 小院统计文案常量类型 |
| `utils/yardMock.ts` | 已迁移已验证 | `YardMock`、`YardPet` 与投喂订单模型 |

### 2.3 补充运行时迁移清单（53 个）

| 范围 | 数量 | 当前状态 |
| --- | --- | --- |
| `main.ts` | 1 | 入口迁移完成，`manifest.json` 的 Vue 3 配置作为移除 Vue 2 分支的依据 |
| `components/PawIcon/` | 6 | tokens、utils、generated registry/metrics/names 与 index 均已迁移 |
| `packages/**/services/` | 41 | 本地服务和领域适配器已迁移，详见第 10、11 节记录 |
| `services/domainReads/` | 5 | adoption/rescue 只读适配器已迁移 |

### 2.4 构建配置迁移（1 个，不计入运行时）

| 文件 | 当前状态 | 备注 |
| --- | --- | --- |
| `vite.config.ts` | 已迁移 | 构建配置已改为 TS；不计入 97 个业务运行时模块 |

### 2.5 不纳入本批次的 JS 文件

| 文件 | 原因 | 状态 |
| --- | --- | --- |
| `eslint.config.js` | ESLint 配置文件，暂不迁移 | 保留 |
| `docs/design/visual-acceptance-console.js` | 文档/验收工具脚本，不属于运行时业务代码 | 保留 |

## 3. JS 依赖边界台账

### 3.1 当前快照

- 生产源码中直接引用本批次剩余 `.js` 模块的 Vue/TS 文件数：0。
- 第一方业务运行时的迁移清单为 97/97；`navigation/`、`utils/` 与 `custom-tab-bar/` 的 44 个文件只是核心子范围。
- 第三方 `uni_modules/` 保留其上游 JS 实现，不纳入本批次业务边界。

本轮已完成基础工具类型化并清理对应导入边界：

- `utils/adoptionPetDisplay.ts`
- `utils/memberLevel.ts`
- `utils/messageUnread.ts`
- `utils/navBack.ts`
- `utils/pawNoticeMessages.ts`
- `utils/profileNav.ts`
- `utils/realNameMock.ts`
- `utils/safeImgSrc.ts`
- `utils/yardDetailStatCopy.ts`
- `utils/adoptEntryGate.ts`
- `utils/navLayout.ts`
- `custom-tab-bar/index.ts`
- `utils/addressMock.ts`
- `utils/addressService.ts`
- `utils/regionMock.ts`
- `navigation/authContinuationStorage.ts`
- `navigation/weixinLoadOptions.ts`
- `navigation/routeContracts.ts`
- `utils/rewardOrderStorage.ts`
- `utils/locationService.ts`
- `utils/yardMock.ts`
- `utils/feedingDemo.ts`
- `utils/petRosterMockApi.ts`
- `navigation/actorCapabilities.ts`
- `navigation/adoptionConditionContract.ts`
- `navigation/adoptionReviewContract.ts`
- `navigation/deeplinkContracts.ts`
- `navigation/feedbackContracts.ts`
- `navigation/legacyRoutes.ts`
- `navigation/managementContracts.ts`
- `navigation/orderContracts.ts`
- `navigation/productionDeepLinkResolver.ts`
- `navigation/rescueListContract.ts`
- `navigation/selectorBridge.ts`
- `navigation/socialMutationContracts.ts`
- `navigation/taskContracts.ts`
- `navigation/taskReadModel.ts`
- `utils/adoptionReviewMockApi.ts`
- `utils/adoptionStorage.ts`
- `utils/applicationMockApi.ts`
- `utils/feedingOrderMockApi.ts`
- `utils/juryMock.ts`
- `utils/juryStorage.ts`
- `utils/rescueStorage.ts`

### 3.2 清理顺序

1. 先迁移被最多 TS/Vue 文件引用的 `navigation/routeContracts.ts`、`navigation/profile` 相关能力和 `utils/*Storage.ts`。
2. 每个 JS 文件迁移后，统一修正消费者的 `.ts` 导入路径和类型导出。
3. 对迁移后的模块运行类型检查、治理测试和小程序构建。
4. `rg` 已确认没有生产源码继续引用旧 `.js` 路径，随后删除旧 `.js` 文件。
5. 全部完成后，已将 [tsconfig.json](/Users/a1-6/Documents/ChatGPT/逢猫/tsconfig.json) 的 `allowJs` 改为 `false`，并重新执行全量验证。

## 4. `any` 类型债务台账

### 4.1 当前问题

| 类型债务 | 快照 | 处理策略 |
| --- | ---: | --- |
| Vue/TS 中的显式 `any` 类型节点 | 0 | TypeScript AST 扫描 `.ts`/`.tsx`/`.d.ts` 与 Vue `<script>`/`<script setup>`；不含 tests/、docs/、uni_modules/ 和生成物 |
| `Record<string, any>` | 0 | 已替换为领域/页面接口或安全的 `unknown` 边界；同上扫描范围 |
| `data(): Record<string, any>` 与其他显式 any 响应式泛型 | 0 个文件/节点 | 页面和组件状态均通过明确接口或具体泛型声明；同上扫描范围 |
| 泛型对象/数组 `PropType` | 旧快照 46 个文件；当前无 any/unknown/裸 object 或裸 Array Props | 建立 `Pet`、`Yard`、`Order`、`Review` 等公共模型；数组明确元素类型 |
| 类型断言 `as`（粗略快照） | 527 | 优先用类型守卫、判别联合、泛型约束和显式接口替代；保留有明确边界的必要断言待复核 |
| `@ts-nocheck` | 0 个文件 | 保持零忽略注释，新增文件纳入严格 ESLint 检查 |
| `ts-ignore` / `ts-expect-error` | 0 | 不允许通过注释绕过类型错误 |

### 4.2 本批次迁移注记

- 本批次新增迁移的 21 个导航/存储模块曾先以 `@ts-nocheck` 保持原有运行时行为；目前 21/21 已完成严格类型化，治理测试已覆盖它们的授权、状态、持久化和深链边界。
- 已完成以下 14 个纯契约/读模型模块的严格类型化：`navigation/socialMutationContracts.ts`、`navigation/productionDeepLinkResolver.ts`、`navigation/taskContracts.ts`、`navigation/taskReadModel.ts`、`navigation/selectorBridge.ts`、`navigation/legacyRoutes.ts`、`navigation/adoptionConditionContract.ts`、`navigation/rescueListContract.ts`、`navigation/adoptionReviewContract.ts`、`navigation/deeplinkContracts.ts`、`navigation/feedbackContracts.ts`、`navigation/actorCapabilities.ts`、`navigation/managementContracts.ts`、`navigation/orderContracts.ts`。这些文件已移除 `@ts-nocheck`，补充输入/结果/reader/任务/路由/领养/救助列表/深链/反馈/权限/管理/订单接口，使用 `unknown` 收窄，并同步移除对应 ESLint 迁移例外。
- 本轮继续完成 `utils/adoptionReviewMockApi.ts`、`utils/adoptionStorage.ts`、`utils/applicationMockApi.ts`、`utils/feedingOrderMockApi.ts`、`utils/juryMock.ts`、`utils/juryStorage.ts`、`utils/rescueStorage.ts` 的严格类型化，补充领养/救助记录、审批 API、投粮订单、评审项、投票持久化和结果接口，使用类型守卫收窄 `unknown`，并关闭全部对应 ESLint 迁移例外。
- 本批次完成 `packages/account/services/actorSession.ts`、`packages/account/services/localProfileStorage.ts`、`packages/yard/services/localManagementStorage.ts`、`packages/animal/services/localManagementStorage.ts` 的严格类型化；为本地存储读写、可信 actor、资料/小院/动物管理记录和失败结果补充显式接口与 `unknown` 类型守卫，并同步收窄受影响编辑页的空值访问。
- 本批次完成 `packages/account/services/taskPageModel.ts`、`packages/account/services/tasksRuntime.ts` 的严格类型化；补充任务卡片/详情目标、持久化任务读取、Actor、领域记录、关系别名、诊断和去重结果接口，并保持跨域只读与 fail-closed 行为。
- 本轮完成 `packages/account/services/managementMutationAdapter.ts` 与 `packages/account/services/managementEditorRuntime.ts` 的严格类型化；为管理编辑 mutation 补充资源类型、可编辑字段、错误结果、writer 上下文和 fail-closed 结果接口，并让编辑页绑定层对资源、reader、writer 和取消状态进行 `unknown` 收窄。两文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮继续完成 `packages/account/services/domainTaskReaders.ts`、`packages/account/services/taskAdapter.ts` 与 `packages/account/services/managementAdapter.ts` 的严格类型化；补充跨域任务 reader、管理资源 reader、可信 actor、只读 envelope、诊断、资源/访问模式和能力结果接口，所有外部 reader 结果以 `unknown` 接收并在边界收窄，保持 fail-closed、只读和无写入行为。三文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `packages/adoption/services/progress.ts`、`packages/adoption/services/reviewActionAdapter.ts`、`packages/adoption/services/reviewAdapter.ts` 与 `services/domainReads/adoption/reviewAdapter.ts` 的严格类型化；为领养进度、审核动作、审核读模型补充结果、状态、审核项、幂等动作和可信 session provider 类型，外部存储/契约结果均以 `unknown` 接收并在边界收窄，保持申请人隔离、审核权限、幂等和只读 fail-closed 行为。四文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `packages/adoption/services/actorCapabilities.ts`、`packages/adoption/services/adoptionConditionContract.ts`、`packages/adoption/services/applicationAdapter.ts` 与 `services/domainReads/adoption/applicationAdapter.ts` 的严格类型化；补充可信 actor、权限策略、领养条件、状态边界、申请关系、脱敏投影、同步 resolver 和只读结果接口，所有外部输入/存储/异常均以 `unknown` 收窄，保持申请人隔离、跨域 ID 拒绝和 fail-closed 行为。四文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `packages/adoption/services/messageStore.ts` 与 `packages/message/services/messageStore.ts` 的严格类型化；补充消息信封、深链、actor、存储读写、消息授权、当前业务记录重读、幂等生产、事件通道和 fail-closed 结果接口，所有外部存储、reader、producer、eventChannel 与异常均以 `unknown` 收窄，并保留消息按 actor 隔离和只读深链行为；message 包继续校验成功动作与业务/审核目标绑定。两文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `packages/rescue/services/messageStore.ts` 的严格类型化；复用已验证的消息信封、深链、actor、存储读写、授权、当前救助记录重读、幂等生产、事件通道和 fail-closed 结果接口，保持救助申请人隔离与只读深链行为。文件移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `services/domainReads/rescue/stateContract.ts`、`services/domainReads/rescue/stateAdapter.ts` 及 `packages/rescue/services/stateContract.ts`、`packages/rescue/services/stateAdapter.ts` 的严格类型化；补充救助三轴状态、兼容旧 `status`、解析结果、同步 resolver、持久化读取和只读失败结果接口，所有外部记录/解析/读取器以 `unknown` 收窄，保持平台审核、评审、资金独立状态轴及 fail-closed 行为。四文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外；状态契约治理测试改为直接执行 `.ts` 源文件。
- 本轮完成 `services/domainReads/rescue/lists.ts`、`packages/rescue/services/lists.ts` 与 `packages/rescue/services/mineReader.ts` 的严格类型化；补充救助申请/评审列表的只读存储适配、可信申请人、状态筛选、关系别名、元数据投影和 fail-closed 结果接口，所有外部选项、actor、记录与存储结果以 `unknown` 收窄，保持 demo 排除、跨用户隔离、三轴状态边界和无写入行为。三文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `packages/rescue/services/progress.ts` 与 `packages/rescue/services/proof.ts` 的严格类型化；为救助进度读模型补充申请人关系、actor、三轴状态投影、脱敏记录和只读结果接口，为证实流程补充输入校验、幂等提交、证实上下文和列表投影接口，保留救助存储单一写边界。两文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外；证明纯校验治理测试改用 TypeScript 运行时转译后执行。
- 本轮完成 `packages/rescue/services/reviewActionAdapter.ts` 与 `packages/rescue/services/reviewAdapter.ts` 的严格类型化；补充审核 session、审核项、读模型、读写器、审核状态联合类型和幂等动作结果，保留审核权限、救助域 ID 隔离、资金状态轴隔离及 fail-closed 行为。两文件均移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `packages/feeding/services/feedbackEvidenceStorage.ts` 与 `packages/feeding/services/feedbackAdapter.ts` 的严格类型化；补充规范化证据、只读列表/详情结果、reader 上下文与失败结果接口，在存储、reader 和 actor 边界使用 `unknown` 收窄，保留 actor 隔离、追加幂等、同步 reader、深链任务 ID 和 fail-closed 行为。两文件移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `packages/feeding/services/orderVisibilityStorage.ts`、`orderRuntime.ts` 与 `taskReader.ts` 的严格类型化；补充用户级可见性记录、持久订单详情、投喂任务和失败结果接口，按 actor 隔离数据并对存储、reader 与记录边界使用 `unknown` 收窄，保留隐藏/取消隐藏幂等、订单域分离、只读权限和 fail-closed 行为。三文件移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外。
- 本轮完成 `packages/dynamic/services/reader.ts`、`orderAssociation.ts` 与 `orderPicker.ts` 的严格类型化；补充动态内容读取结果、显示投影、动物关联、反馈资格、订单选择项及 picker 响应接口，所有持久化记录与外部选项均以 `unknown` 接收并在边界收窄，保留 actor/公开可见性授权、场景过滤和只读行为。三文件移除 `@ts-nocheck`，并关闭对应 ESLint 迁移例外；新增订单选择器与动物关联治理测试。
- 本轮完成 `packages/yard/services/managementEditorGate.ts` 与 `packages/animal/services/animalManagementEditorGate.ts` 的严格类型化；为资源类型、ID 校验与 fail-closed 结果补充显式接口，两文件移除 `@ts-nocheck` 并加入 ESLint 严格检查；新增 gate 边界治理测试。
- 本轮继续完成 `packages/feeding/services/orderMockApi.ts` 与 `orderAdapter.ts` 的严格类型化；补充投粮订单 fixture、列表/详情响应、只读适配器结果、可信 actor、诊断和校验联合类型，在外部 reader、参数与异常边界使用 `unknown` 收窄，保持订单隔离、fail-closed 与无写入行为。两文件移除 `@ts-nocheck` 并加入 ESLint 严格检查。
- 本轮完成 `packages/dynamic/services/feedbackPublisher.ts` 的严格类型化；为 actor、持久化端口、动态/反馈记录、关联关系、证据、摘要及成功/失败结果补充显式接口，在业务记录与策略输入边界使用 `unknown` 并验证后收窄，保留 actor/小院关系校验、反馈幂等、普通动态与反馈证据隔离及写入失败回滚行为。移除最后一个 `@ts-nocheck`，纳入 ESLint 严格检查，并补充普通动态发布隔离与幂等治理测试。
- 已完成 `navigation/authContinuationStorage.ts` 的不必要类型断言清理；continuation target 复用 `DeepLinkEnvelope`，持久化时间戳和类别显式窄化，并增加恶意时间戳回归测试。
- 本批次新增共享 `utils/adoptionMockData.ts` 宠物元数据契约与 `utils/rescueApplicationMockData.ts` 求助表单字段契约，集中领养/救助申请与选宠 fixture，并让两个申请页、`AdoptPickCatsSheet` 和 `PawAdoptionPetsCard` 共用类型；另以 `utils/mediaPickerMetadata.ts` 描述微信/非微信媒体选择回调所消费的最小响应字段。移除选宠组件的 `any` 参数与 `any[]` Props、两个申请页的 `Record<string, any>` 状态声明，以及这四个 Vue 文件中的所有 `any` 用法；页面状态与表单 fixture 通过工厂函数获得相互独立的可变副本。
- 本批次扩展 `utils/yardMock.ts` 的小院、统计、宠物、评论作者/回复、公告、投喂者和排行榜 metadata；新增 `utils/petDetailMetadata.ts`，集中宠物详情 fallback 与缩略列表 mock，并提供隔离副本工厂。`PawYardDetailFigma.vue` 与 `PawPetDetailFigma.vue` 改用共享模型和显式页面状态/回调类型，移除两组件内全部 `any` 标注；新增 fixture 关联完整性、克隆隔离和源码 any 守卫测试。保留原界面文案的全角空格渲染，仅改用实体/转义表达以满足源码 lint。
- 当前 TS/Vue/d.ts 源码中的 `@ts-nocheck`、`@ts-ignore` 与 `@ts-expect-error` 均为 0。

本轮验证：

- `npm run typecheck` 通过。
- 上一批 13 个相关领养/深链/反馈/任务/消息治理测试文件共 92 项通过；随后权限/管理/订单及关联治理测试共 79 项通过；本轮领养/救助/审批/投票相关回归测试通过。
- 本轮 7 个工具/存储模块执行 ESLint，通过；同时修正了受类型收窄影响的领养审核页和评审详情页空值访问。
- 本批次 4 个账号/小院/动物服务模块执行 ESLint，通过；本地管理存储回归测试 5/5 通过。
- 本批次 2 个账号任务读模型/运行时模块执行 ESLint，通过；账号任务运行时与任务页治理测试 14/14 通过。
- 本轮 2 个账号管理编辑服务执行 ESLint，通过；管理 mutation 治理测试 3/3 通过。
- 本轮 3 个账号 task/management reader 服务执行 ESLint，通过；对应治理测试 29/29 通过。
- 本轮 4 个领养进度/审核服务执行 ESLint，通过；领养进度 4/4、审核读模型 8/8、审核动作 2/2 治理测试通过。
- 本轮 4 个领养 actor/条件/申请适配器执行 ESLint，通过；申请适配器 11/11、进度 4/4、任务领域 reader 7/7、领养身份链 3/3 治理测试通过。
- 本轮 2 个 adoption/message 消息存储服务执行 ESLint，通过；消息存储与消息生产治理测试 11/11 通过；`npm run typecheck` 与 `git diff --check` 通过。
- 本轮救助消息存储服务执行 ESLint，通过；全量治理测试 385/385 通过；`npm run typecheck`、`git diff --check` 与小程序构建通过。
- 本轮完成救助状态 contract/adapter 四文件严格类型化；四文件 ESLint 通过，救助状态、进度和任务领域定向治理测试 30/30 通过；全量治理测试 385/385 通过；`npm run typecheck`、`git diff --check` 与小程序构建通过。
- 本轮救助列表 adapter 与 mineReader ESLint 通过；救助列表适配治理测试 5/5、任务领域 reader 7/7 通过，mineReader 真实存储 smoke check 通过；全量治理测试 385/385 通过；`npm run typecheck`、`git diff --check` 与小程序构建通过。
- 本轮救助 progress/proof 服务 ESLint 通过；救助 progress 治理测试 8/8、proof 流程测试 6/6 通过；`npm run typecheck` 与 `git diff --check` 通过。
- 本轮救助 review action/entry 服务 ESLint 通过；救助审核治理测试 4/4 通过；`npm run typecheck` 与 `git diff --check` 通过。
- 本轮投喂反馈存储与只读 adapter ESLint 通过；对应治理测试 14/14 通过；`npm run typecheck` 通过。
- 本轮全量治理测试 375/375 通过；`npm run build:mp-weixin` 与包体积、资源和边界检查通过（主包 1543.3 KiB、总包 3401.1 KiB）；本批次文件 `git diff --check` 通过。
- 本批投喂订单可见性、详情 reader 与任务 reader 执行 ESLint、`npm run typecheck` 均通过；对应治理测试 8/8 通过。
- 本轮全量治理测试 375/375 通过；`npm run build:mp-weixin` 及包体积、资源和边界检查通过（主包 1543.3 KiB、投喂分包 213.5 KiB、总包 3401.1 KiB）；本批范围 `git diff --check` 通过。
- 本批动态详情 reader 与订单关联/picker 执行严格 ESLint、`npm run typecheck` 均通过；动态 reader 4/4、订单 picker 与关联 3/3 定向测试通过。
- 本批小院/动物编辑 gate 执行严格 ESLint、`npm run typecheck` 通过；gate 边界治理测试 2/2 通过。
- 本轮投喂订单 API/adapter 执行严格 ESLint 与 `npm run typecheck` 通过；订单、反馈相关定向测试 36/36、全量治理测试 381/381 通过；`npm run build:mp-weixin` 及包体积、资源和边界检查通过（主包 1543.3 KiB、投喂分包 213.5 KiB、总包 3401.4 KiB）；本批范围 `git diff --check` 通过。
- 本轮全量治理测试 380/380 通过；`npm run build:mp-weixin` 及包体积、资源和边界检查通过（主包 1543.3 KiB、动态分包 78.7 KiB、总包 3401.4 KiB）；本批范围 `git diff --check` 通过。
- 本轮全量治理测试 378/378 通过；`npm run build:mp-weixin` 及包体积、资源和边界检查通过（主包 1543.3 KiB、动态分包 78.7 KiB、总包 3401.4 KiB）；本批范围 `git diff --check` 通过。
- `feedbackPublisher.ts` 与 `authContinuationStorage.ts` 严格 ESLint、`npm run typecheck` 通过；反馈发布与 auth continuation 定向测试各 4/4，全量治理测试 383/383 通过；`npm run build:mp-weixin` 及包体积、资源和边界检查通过（主包 1543.3 KiB、动态分包 78.7 KiB、总包 3401.6 KiB）；`git diff --check` 通过，并复查确认 TS/Vue/d.ts 中三类 TS 忽略注释均为 0。
- 本批共享领养宠物、救助表单与媒体选择 metadata 相关严格 ESLint 0 errors（仍有既有 Vue 模板换行 warnings）；`npm run typecheck` 通过，metadata 专项测试 3/3、关联任务领域测试 7/7、全量治理测试 386/386 通过；`npm run build:mp-weixin`、包体积/资源/边界检查及 `git diff --check` 通过（主包 1544.5 KiB、总包 3401.3 KiB）。
- 本批小院/宠物详情 metadata 定向 ESLint 0 errors（仍有既有 Vue 模板顺序/换行 warnings）；`npm run typecheck` 通过，小院与宠物 mock 定向测试 3/3、订单关联回归测试 3/3、全量治理测试 389/389 通过；`npm run build:mp-weixin`、包体积/资源/边界检查及 `git diff --check` 通过（主包 1546.4 KiB、总包 3401.7 KiB）。
- 本批将首页动态卡片、公告、频道与小院卡片 mock 抽至 `utils/homeFeedMockData.ts`，为卡片和首页响应式状态建立显式 metadata/interface，并让 `FeedCard.vue` 使用共享卡片契约；`pages/index/index.vue` 与 `FeedCard.vue` 已无 `any` / `Record<string, any>`。定向 ESLint 0 errors（17 条既有模板换行/属性顺序 warnings）；typecheck 通过，首页 metadata 测试 3/3、全量治理测试 392/392 通过；小程序构建与包体积/资源/边界检查、`git diff --check` 通过（主包 1546.9 KiB、总包 3402.3 KiB）。
- 本批新增共享 `utils/announcementMetadata.ts`，统一首页与小院公告 metadata，并将公告数据解析、API envelope 窄化、旧文案规格换算和队列项规范化集中到以 `unknown` 为输入的纯函数。`PawAnnouncementMarquee.vue` 采用明确队列/定时器/WebSocket/动画状态，改用 `Set` 做公告去重，补齐 `queued`、`finished`、`click` Emits；该组件不再包含 `any` 或 `Record<string, any>`。新增公告 metadata 治理测试 4/4，并从 Emits 未声明清单中移除此组件。
- 本批 `PawAnnouncementMarquee.vue`、共享公告 metadata、首页/小院 mock 和治理测试定向 ESLint 通过；`npm run typecheck`、公告与首页 metadata 定向测试 7/7、全量治理测试 396/396、`npm run check:native-ui`（295 个源码文件，5 条历史基线项）及 `git diff --check` 均通过。`npm run build:mp-weixin` 与包体积/资源/边界检查通过，主包 1547.3 KiB、总包 3402.7 KiB；主包仍高于 1.5 MiB 质量建议线，低于 2 MiB 硬上限。
- 本批将 `YardReviewFeed.vue` 的主评论、文字/语音回复和投粮记录 fixture 移到 `utils/yardReviewFeedMetadata.ts`，建立 discriminated reply metadata 和独立副本工厂；页面/组件状态改用显式接口，替换全部 `any` 与 `Record<string, any>`，并将四个已有 `$emit` 事件纳入 `emits` 契约。
- 本批 `YardReviewFeed.vue` 与 metadata 模块定向 ESLint 0 errors（13 条原有模板格式/属性名 warnings）；`npm run typecheck`、小院 metadata focused 测试 5/5、全量治理测试 398/398、`npm run check:native-ui`（296 个源码文件，5 条历史基线项）、小程序构建、包体积/资源/边界检查及工作区 `git diff --check` 均通过。构建主包 1547.3 KiB、总包 3402.7 KiB，主包仍高于 1.5 MiB 质量建议线，低于 2 MiB 硬上限。
- 本批将动态发布页的订单/动物 mock 与 API/存储输入规整集中到 `packages/dynamic/services/publishEditorMetadata.ts`，复用订单、宠物和选择器的 metadata；发布编辑页及订单/动物选择器改用显式状态、Props、Emits 和事件类型，移除这些文件中的全部显式 `any` 与 `as any`。
- 本批 metadata 测试 3/3、全量治理测试 401/401、`npm run typecheck`、`npm run check:native-ui`（297 个源码文件，5 条历史基线项）、生产构建及包体积/资源/边界检查通过；定向 ESLint 0 errors（12 条既有模板换行 warnings），`git diff --check` 通过。当前 `any` token 快照从 909 降至 832，`Record<string, any>` 从 133 降至 130，宽泛 `data()` 状态从 104 个文件降至 101 个；构建主包 1547.3 KiB、总包 3404.4 KiB，主包仍高于 1.5 MiB 质量建议线，低于 2 MiB 硬上限。
- 本批继续收紧动物详情页：页面状态、宠物/小院/评论和底栏事件均有显式类型；将公开动物记录规范化与 Figma 视觉态宠物 fixture 提取到 `utils/petDetailMetadata.ts`，治理测试覆盖字段补齐、数组窄化、扩展 metadata 保留、无标识拒绝和 fixture 不污染源 mock。该页及 metadata 无 `any` 注解；快照从 832 降至 804 个 `any` token、`Record<string, any>` 从 130 降至 129、宽泛 `data()` 状态从 101 个文件降至 100 个。`npm run typecheck`、宠物 metadata 测试 5/5、全量治理测试 401/401、`npm run check:native-ui`（297 个源码文件，5 条历史基线项）、生产构建及包体积/资源/边界检查和 `git diff --check` 均通过；构建主包 1549.2 KiB、总包 3405.8 KiB。metadata 与测试 ESLint 通过；页面 ESLint 仍报原有模板不规则空白、未使用导入及模板格式问题，本批未改动模板。
- 本批继续类型化领养审核详情与列表：新增 `utils/adoptionReviewMetadata.ts` 作为审核记录窄化、审核卡片 view-model 和兜底宠物 mock 的共享契约；页面/`PawAdoptionReviewCard` 使用明确状态、动作、审核项和 Props/Emits 类型，移除目标范围全部显式 `any` 与 `as any`，不改模板布局。源码快照从 804 降至 770 个 `any` token、`Record<string, any>` 从 129 降至 127、宽泛 `data()` 状态从 100 个文件降至 99 个。`npm run typecheck`、领养 metadata 测试 5/5、全量治理测试 403/403、`npm run check:native-ui`（298 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 通过；定向 ESLint 0 errors、17 条既有模板换行 warnings。构建主包 1552.6 KiB、总包 3408.4 KiB，仍低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化领养评审详情页：页面状态、评审动作成功/失败、路由参数、分享数据、证据、宠物与投票全部有明确类型；`JuryItem`/`JuryVote` 统一复用 `utils/juryMock.ts` 的领域 metadata，`juryStorage` 不再维护弱化的重复项类型，并补齐院落与摘要字段的规范化。目标页移除 24 个 `any` token（包括宽泛 `data()`、回调参数和 `as any`），源码快照降至 746 个 `any` token、126 处 `Record<string, any>`、98 个宽泛 `data()` 文件。定向 ESLint 0 errors（8 条既有模板换行 warnings）；`npm run typecheck`、评审 metadata 定向测试 6/6、全量治理测试 404/404、小程序构建与包体积/资源/边界检查、`git diff --check` 通过。构建主包 1552.5 KiB、总包 3408.8 KiB，低于 2 MiB 硬上限但仍高于 1.5 MiB 质量建议线。
- 本批类型化小院创建页与地址选择卡：新增 `utils/yardCreateMetadata.ts` 集中 recorded-state 地址 mock、隔离副本工厂和录音停止结果窄化；页面状态、路由参数、地址/地点回调、微信图片回调、权限结果与录音管理器使用明确类型；`PawAddressPickerCard` 复用 `AddressRecord` Props/状态并规范化跨页事件输入。移除这两个 Vue 文件共 23 个 `any` token（含 3 处 `Record<string, any>` 与两份宽泛页面状态），源码快照降至 723 个 `any` token、123 处 `Record<string, any>`、96 个宽泛 `data()` 文件。定向 ESLint 0 errors（15 条既有模板换行 warnings）；`npm run typecheck`、小院 metadata 定向测试 6/6、全量治理测试 405/405、小程序构建与包体积/资源/边界检查、`git diff --check` 通过。构建主包 1553.3 KiB、总包 3409.8 KiB，低于 2 MiB 硬上限但仍高于 1.5 MiB 质量建议线。
- 本批类型化 `PawPetRoster.vue`：响应式状态复用小院宠物、名册分组和筛选计数 metadata；新增共享卡片主人类型及待认领/已认领 mock metadata，移除该组件的宽泛状态、请求断言及回调 `any`，不改模板布局/样式。源码快照减少 18 个 `any` token，降至 705；`Record<string, any>` 降至 122 处，宽泛 `data()` 状态降至 95 个文件。定向 ESLint 0 errors（9 条既有模板换行/选项顺序 warnings）；`npm run typecheck`、小院 metadata 测试 7/7、全量治理测试 406/406、小程序构建与包体积/资源/边界检查、`git diff --check` 通过。构建主包 1553.2 KiB、总包 3409.7 KiB，仍低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化地址表单：新增 `utils/addressFormMetadata.ts` 共享收货/服务地址 demo fixture、表单 draft 和微信地址输入规范化；`PawAddressForm.vue` 复用 `AddressRecord`、`AddressKind` 与地点 metadata，为响应式表单、Props、watch 和平台/子组件事件补齐类型，移除 18 个 `any` token、1 处宽泛 `Record` 和该组件的 `Record<string, any>` 状态。全局快照降至 687 个 `any` token、120 处 `Record<string, any>`、94 个宽泛 `data()` 文件。定向 ESLint 0 errors（14 条既有模板换行/选项顺序 warnings）；`npm run typecheck`、地址表单 metadata 测试 2/2、全量治理测试 408/408、小程序构建与包体积/资源/边界检查、`git diff --check` 通过。构建主包 1554.5 KiB、总包 3410.9 KiB，低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化地址列表页：状态、路由参数、地址操作和选择结果统一复用 `AddressRecord`/`AddressKind`；将 addressPicked 输出封装为共享 `AddressPickedPayload` 投影，避免额外 metadata 泄露；移除列表页未使用的本地重复地址 mock，并将 eventChannel 从当前页面栈以明确运行时接口读取。页面内无 `any`，减少 15 个 `any` token、1 处 `Record<string, any>` 和1个宽泛 `data()` 文件。定向 ESLint 0 errors（3 条既有模板换行 warnings）；`npm run typecheck`、地址 metadata 定向测试 3/3、全量治理测试 409/409、小程序构建与包体积/资源/边界检查及 `git diff --check` 通过。全局快照降至 672 个 `any` token、119 处 `Record<string, any>`、93 个宽泛 `data()` 文件；构建主包 1554.6 KiB、总包 3411.2 KiB，低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化地址编辑页与地址卡：编辑页新增明确状态与路由输入窄化，保存事件复用 `AddressFormDraft`，表单 ref 和 opener eventChannel 通过运行时守卫读取；地址卡复用 `AddressRecord`、`AddressCardMode` 并声明类型化 Emits，地址表单的 `save` emit 也补齐 draft 验证契约。未改动模板布局或样式。移除 6 个 `any` token（2 处 `Record<string, any>`，1 个宽泛 `data()` 文件），全局快照降至 666 个 `any` token、117 处 `Record<string, any>`、92 个宽泛 `data()` 文件。`npm run typecheck`、地址 metadata 定向测试 4/4、全量治理测试 410/410、小程序构建及包体积/资源/边界检查、`git diff --check` 通过；定向 ESLint 0 errors、16 条既有 Vue 格式/选项顺序 warnings。构建主包 1554.6 KiB、总包 3411.7 KiB，仍低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批完成地区选择器类型化：新增共享地区选择 demo metadata、地区路径规范化及 `complete`/`change` 事件 payload 契约；`PawRegionPicker` 复用 `RegionNode`、显式响应式状态和 Emits，地区选择页改为 unknown 路由/eventChannel 输入窄化，移除两个文件内全部 `any`。减少 15 个 `any` token、2 处 `Record<string, any>` 与 2 个宽泛 `data()` 状态文件，全局快照降至 651 个 `any` token、115 处 `Record<string, any>`、90 个宽泛 `data()` 文件。地区 fixture 克隆隔离、错误 payload 拒绝和源码类型守卫纳入地址 metadata 测试；`npm run typecheck`、定向测试 5/5、全量治理测试 411/411、小程序构建及包体积/资源/边界检查、`git diff --check` 通过；定向 ESLint 0 errors、4 条既有 Vue 模板换行 warnings。构建主包 1555.4 KiB、总包 3412.7 KiB，低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化地点选择：将地点 fallback 列表与 `LocationPlace`/结果接口集中到 `utils/locationMetadata.ts`，坐标改为数值型并规范化外部未知数据；地点选择组件补齐状态、Props 派生值与 Emits 类型；`locationService` 以类型守卫替代候选记录和 uni API 的类型断言。移除组件内 5 个 `any` token、1 处 `Record<string, any>` 和 1 个宽泛 `data()` 状态。新增 fallback 副本隔离、搜索筛选、API 数据规范化及组件类型治理测试；全局快照降至 646 个 `any` token、114 处 `Record<string, any>`、89 个宽泛 `data()` 文件。`npm run typecheck`、地点 metadata 定向测试 3/3、全量治理测试 414/414、小程序构建及包体积/资源/边界检查、`git diff --check` 通过；定向 ESLint 0 errors、3 条既有 Vue 模板换行 warnings。构建主包 1556.0 KiB、总包 3413.4 KiB，低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化动物资料编辑页与选择 Sheet：新增 `utils/animalEditorMetadata.ts` 统一表单默认值及选项并提供隔离副本；编辑页和 `PawSelectionSheet` 改用显式状态、选择项、事件及平台输入类型，窄化本地存储返回的 yard/animal 字段，目标文件移除全部 `any`。全局快照减少 24 个 `any` token、2 处 `Record<string, any>` 和 2 个宽泛 `data()` 状态文件，降至 622/112/87。metadata 定向测试 2/2、全量治理测试 416/416、`npm run typecheck`、`npm run check:native-ui`（302 个源码文件，5 条历史基线项）、小程序构建与包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、13 条 Vue 模板格式/选项顺序 warnings。构建主包 1557.0 KiB、总包 3414.4 KiB，低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化小院公开/管理名册入口：复用 `YardPet` 与 `PetRosterCardOwner` 领域类型，为页面状态和未知路由输入补齐接口/窄化；管理页以运行时守卫调用名册刷新方法，并采用 uni ActionSheet 的成功结果契约。两页不含显式 `any` 或 `as any`，模板布局/样式未改。全局快照减少 13 个 `any` token、2 处 `Record<string, any>` 和 2 个宽泛 `data()` 状态文件，降至 609/110/85。名册入口专项治理测试 1/1、全量治理测试 417/417、`npm run typecheck`、`npm run check:native-ui`（302 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、1 条既有模板属性顺序 warning。构建主包 1557.0 KiB、总包 3414.7 KiB，低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化小院认证、编辑和入驻说明页：将认证默认表单/图片 fixture 与入驻规则文本移入小院 service metadata，提供克隆工厂；认证状态改为 `97 | 98 | 99` 联合类型，编辑字段、响应式状态、未知路由输入、图片选择和表单事件均收窄为明确契约。三页模板布局/样式保持不变。全局快照减少 8 个 `any` token、3 处 `Record<string, any>` 和 3 个宽泛 `data()` 状态文件，降至 601/107/82。metadata 定向测试 2/2、全量治理测试 419/419、`npm run typecheck`、`npm run check:native-ui`（304 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、6 条既有 Vue 模板换行 warnings。构建主包 1557.0 KiB、总包 3415.9 KiB，低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化动物相册页：将 14 条相册 fixture、筛选项和菜单动作抽至 `packages/animal/services/albumMetadata.ts`，定义相册实体/分类/排序/动作和页面状态接口，并为每个页面实例提供独立可变副本；页面路由输入改为 `unknown` 窄化，长按事件坐标与系统窗口数据经运行时检查后使用。页面移除 15 个 `any` token、1 处宽泛 `Record` 和 1 个宽泛 `data()` 状态，模板与样式未改。新增 metadata 克隆隔离和源码类型守卫测试；全量源码按本次统一扫描口径重核为 569 个 `any` token、106 处 `Record<string, any>`、81 个宽泛 `data()` 文件。定向 ESLint、metadata 测试 2/2、全量治理测试 421/421、`npm run typecheck`、`npm run check:native-ui`（305 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；构建主包 1557.0 KiB、总包 3416.8 KiB，低于 2 MiB 硬上限但高于 1.5 MiB 质量建议线。
- 本批类型化投喂订单详情页与 Figma 详情组件：页面读取复用持久化 reader 的成功结果类型、订单可见性和 `FeedingOrderDetail` mock API 契约；共享 `packages/feeding/services/detailMetadata.ts` 集中详情占位对象、timeline fallback 和图像 fixture，组件 Props、页面状态及展示派生值均显式类型化，clipboard/toast 边界以 `unknown` 窄化。两文件移除 22 个 `any` token、3 处 `Record<string, any>` 和 2 个宽泛 `data()` 状态，视觉模板内容/样式保持不变（全角空格改为等值转义表达以通过 lint）。新增 metadata 隔离与源码类型守卫测试；全量源码扫描为 547 个 `any` token、103 处 `Record<string, any>`、79 个宽泛 `data()` 文件。定向 ESLint 0 errors（10 条既有模板属性换行 warnings）、metadata 测试 2/2、全量治理测试 423/423、`npm run typecheck`、`npm run check:native-ui`（306 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；主包 1557.0 KiB、投喂分包 214.8 KiB、总包 3418.0 KiB，均未超过硬上限，主包仍高于 1.5 MiB 质量建议线。
- 本批类型化领养/救助证实组件：新增 `packages/adoption/services/evidenceMetadata.ts`，集中证实人 comment view-model、默认示例图、页面状态、救助 proof 兼容字段规整、领养草稿读取和双平台媒体选择结果窄化；照片索引与提交事件 payload 均有明确契约，组件不再维护本地 `any` proof normalizer 或 `Record<string, any>` 状态。移除 16 个 `any` token、1 处宽泛 `Record` 和 1 个宽泛 `data()` 状态，页面视觉布局未改。新增 proof 元数据、表单草稿、媒体回调、克隆隔离及源码类型测试 3/3；全量源码扫描为 531 个 `any` token、102 处 `Record<string, any>`、78 个宽泛 `data()` 文件。定向 ESLint 0 errors（8 条既有模板属性换行 warnings）、`npm run typecheck`、全量治理测试 426/426、`npm run check:native-ui`（307 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；主包 1557.0 KiB、领养分包 256.0 KiB、总包 3419.2 KiB，均低于硬上限，主包仍高于 1.5 MiB 质量建议线。

- 本批类型化救助审核列表与详情页：页面状态、审核状态/动作、路由输入、审核动作通知授权上下文改用明确接口并以 `unknown` 窄化，复用救助审核适配器结果；为审核列表项的展示字段及证据图片补齐只读领域类型。该流程没有页面自定义 mock，继续消费审核适配器的持久化读模型；移除两页共 17 个显式 `any` token、2 个宽泛 `Record` 状态。新增展示投影/图片窄化回归和源码类型守卫，救助审核专项测试 5/5；统一源码扫描当前为 531 个 `any` token、100 处 `Record<string, any>`、76 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 428/428、`npm run check:native-ui`（307 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 通过；定向 ESLint 0 errors、2 条既有模板换行 warnings；主包 1557.0 KiB、救助分包 127.6 KiB、总包 3419.5 KiB，均低于硬上限，主包仍高于 1.5 MiB 质量建议线。

- 本批将 `YardFeedPopup` 的投喂套餐、权益文案与页面状态移到 `components/yard/yardFeedPopupMetadata.ts`，提供独立可变 fixture 副本、套餐/付款 payload 接口及 `unknown` 支付参数规范化；支付完成/失败行为与金额文案保持原值。`YardFeedPopup` 和动物详情 `DetailTabber` 共移除 17 个 `any` token、2 处宽泛 `Record<string, any>` 与 2 个宽泛 `data()` 状态，并补齐弹层 Emits、支付入参和业务 payload 类型。新增 metadata 克隆隔离、支付参数校验及源码守卫测试 3/3；全量扫描降至 514 个 `any` token、96 处 `Record<string, any>`、74 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 431/431、`npm run check:native-ui`（308 个源码文件，5 条历史基线项）、小程序构建和包体积/资源/边界检查通过；定向 ESLint 0 errors、6 条既有模板换行 warnings；主包 1558.4 KiB、动物分包 222.8 KiB、总包 3420.9 KiB，低于硬上限但主包仍高于 1.5 MiB 质量建议线。

- 本批类型化共享图片组件：新增 `components/base/pawImageMetadata.ts`，集中图片来源 URL/对象字段、尺寸格式化、展示模式、压缩后路径和预览 payload 契约；`PawImage.vue` 补齐预览源 Props 与 click/preview/load/error Emits 类型，保留原有 URL 允许规则、尺寸和预览行为。该组件没有 mock 数据，不新增 fixture；移除 13 个显式 `any`（含 `any[]` Props），页面与样式布局未改。新增 URL/尺寸/模式/预览 payload 及源码治理测试 3/3；全量源码扫描为 501 个 `any` token、96 处 `Record<string, any>`、74 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 434/434、`npm run check:native-ui`（309 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查通过；定向 ESLint 0 errors、2 条既有模板换行 warnings；主包 1559.3 KiB、总包 3421.8 KiB，低于硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批类型化账号个人资料页：新增 `packages/account/services/profilePageMetadata.ts`，集中评价/时间线/领养/投粮/小院 fixture、卡片联合类型、统计与动作契约，并确保页面实例拿到互不共享的嵌套数组；公开资料、stats、路由参数和动作面板输入由 `unknown` 规范化。profile 页移除 12 个 `any` token、1 处宽泛 `Record` 与 1 个宽泛 `data()` 状态，保留既有 mock 文案、页面布局和交互逻辑；全角空格改为等值转义以清除 lint 错误。metadata 与源码守卫测试 3/3，`npm run typecheck`、全量治理测试 437/437、`npm run check:native-ui`（310 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、4 条既有模板换行 warnings。全量源码扫描为 489 个 `any` token、95 处 `Record<string, any>`、73 个宽泛 `data()` 文件；主包 1559.3 KiB、总包 3422.4 KiB，均低于硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批将 discovery 排行页四个 tab 的榜单 fixture、podium/rank/self 行契约和标签 metadata 抽至 `packages/discovery/services/rankingMetadata.ts`，通过克隆工厂保证页面状态与 mock 源数据隔离；页面只消费具名 `LeaderboardPageState`，移除 8 个 `any` token、2 处宽泛 `Record` 与 1 个宽泛 `data()`。不改模板、样式及榜单文案。新增榜单完整性、头像 fallback、tab/行副本隔离及源码守卫测试 3/3；全量源码扫描降至 481 个 `any` token、93 处 `Record<string, any>`、72 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 440/440、`npm run check:native-ui`（311 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、5 条既有模板换行 warnings。主包 1559.3 KiB、总包 3422.4 KiB，低于各包硬上限，主包仍高于 1.5 MiB 质量建议线。
- 本批将账号浏览记录页的动态/小院 mock、展示用图片覆盖和空态路由状态抽至 `packages/account/services/historyMetadata.ts`；动态展示基础字段复用首页的 `HomeFeedTemplateMetadata`，小院卡片使用 badges/org 判别联合，并以工厂隔离每页可变副本。页面移除 8 个 `any` token、1 处宽泛 `Record` 与 1 个宽泛 `data()`，不改模板、样式、卡片内容或导航行为。新增 mock/判别联合/副本隔离/路由态及源码守卫测试 3/3；全量源码扫描降至 473 个 `any` token、92 处 `Record<string, any>`、71 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 443/443、`npm run check:native-ui`（312 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、4 条既有模板换行 warnings。主包 1559.3 KiB、总包 3422.5 KiB，低于各包硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批类型化账号关系列表：新增 `packages/account/services/relationMetadata.ts`，为关注/粉丝用户行、页面响应式状态和 route options 建立显式接口；两组五行 mock 与不同页面实例互相隔离，`userId`/旧 `pawId`、URL 编码昵称及 `followers`/`fans` tab 别名继续按原行为解析。页面移除 7 个 `any` token、1 处宽泛 `Record` 和 1 个宽泛 `data()`，不改模板、样式或关注/个人资料交互。metadata、副本隔离、路由归一化及源码守卫测试 3/3；全量源码扫描降至 466 个 `any` token、91 处 `Record<string, any>`、70 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 446/446、`npm run check:native-ui`（313 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、0 warnings。主包 1559.3 KiB、总包 3422.9 KiB，低于各包硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批类型化 discovery 城市选择页：新增 `packages/discovery/services/cityPickerMetadata.ts`，集中城市分组、热门城市、页面状态和安全路由参数归一化；城市列表与查询过滤返回隔离副本，保留原有城市名称、排序及重复的演示项。页面移除 7 个 `any` token、1 处宽泛 `Record<string, any>` 与 1 个宽泛 `data()` 状态，并用运行时校验读取 eventChannel；模板、样式和选择/存储/返回行为未改。新增 fixture 完整性、副本隔离、筛选/索引、路由解码与源码守卫测试 4/4；全量源码扫描降至 459 个 `any` token、90 处 `Record<string, any>`、69 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 450/450、`npm run check:native-ui`（314 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、3 条既有 Vue 模板格式 warnings。主包 1559.3 KiB、discovery 分包 196.9 KiB、总包 3423.7 KiB，均低于各包硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批类型化 discovery 搜索页：新增 `packages/discovery/services/searchPageMetadata.ts`，集中搜索页响应式状态、tab metadata、搜索历史演示 fixture、路由选项解析和持久化历史数据窄化；页面移除 5 个 `any` token、1 处宽泛 `Record<string, any>` 与 1 个宽泛 `data()` 状态，所有历史记录读取均先验证为非空字符串。搜索状态分支、文案、模板和样式保持不变。新增 metadata 副本隔离、route state/popup、历史数据窄化及源码守卫测试 4/4；全量源码扫描降至 454 个 `any` token、89 处 `Record<string, any>`、68 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 454/454、`npm run check:native-ui`（315 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、8 条既有 Vue 模板格式 warnings。主包 1559.3 KiB、discovery 分包 197.6 KiB、总包 3424.4 KiB，均低于各包硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批完成 discovery 搜索结果组件类型化：新增 `packages/discovery/services/searchResultMetadata.ts`，统一动态卡片、带 badge/机构判别联合的小院卡、用户行及画廊 fixture；动态字段复用 `HomeFeedTemplateMetadata`，组件实例获得深度隔离副本，双列继续按原索引奇偶分列。组件移除 11 个 `any` token、1 处宽泛 `Record<string, any>` 与 1 个宽泛 `data()` 状态，作者/小院/用户跳转和点赞操作改用明确的行类型，模板与样式未改。另移除两个原本未参与渲染的图片路径局部变量。metadata、嵌套隔离、双列顺序及源码守卫测试 4/4；全量源码扫描降至 443 个 `any` token、88 处 `Record<string, any>`、67 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 458/458、`npm run check:native-ui`（316 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、19 条既有 Vue 模板格式/选项顺序 warnings。主包 1559.3 KiB、discovery 分包 155.3 KiB、总包 3382.1 KiB，均低于硬上限；构建体积较前一批减少 42.3 KiB，主包仍高于 1.5 MiB 质量建议线。
- 本批类型化账号“我帮助过的动物”页：新增 `packages/account/services/helpedAnimalsMetadata.ts`，集中 11 张帮助记录图片 mock、页面状态与预览参数契约；每个页面实例拿到独立图片数组，图片索引经整数和边界校验后再传入预览 API。页面移除 2 个 `any` token、1 处宽泛 `Record<string, any>` 与 1 个宽泛 `data()` 状态，模板和样式未改。新增图片顺序/副本隔离、有效与无效预览索引及源码守卫测试 3/3；全量源码扫描降至 441 个 `any` token、87 处 `Record<string, any>`、66 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 461/461、`npm run check:native-ui`（317 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、0 warnings。主包 1559.3 KiB、account 分包 443.5 KiB、总包 3382.5 KiB，均低于各包硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批类型化消息列表页：新增 `packages/message/services/messageListMetadata.ts`，集中分类标签、页面状态和未知路由参数校验；列表项/失败状态直接派生自持久化 `readMessages` 结果，不另造 mock 或重复消息模型。页面移除 7 个 `any` token、1 处宽泛 `Record<string, any>` 与 1 个宽泛 `data()` 状态，保留消息分类、深链跳转和登录续接行为，模板与样式未改。分类副本隔离、路由参数窄化及源码类型守卫测试 3/3；全量源码扫描降至 434 个 `any` token、86 处 `Record<string, any>`、65 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 464/464、`npm run check:native-ui`（318 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、1 条既有 Vue 模板换行 warning。主包 1559.3 KiB、message 分包 17.6 KiB、总包 3383 KiB，均低于硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批类型化领养结果页：新增 `packages/adoption/services/resultMetadata.ts`，集中 80–85 六种结果文案/状态配置、结果 outcome 与 variant 映射、页面状态和未知路由参数归一化；保留现有按钮文案、CTA 分支和异常回退。页面移除 9 个 `any` token、2 处宽泛 `Record<string, any>` 与 1 个宽泛 `data()` 状态，模板和样式未改。新增六态配置、路由兼容/窄化及源码守卫测试 3/3；全量源码扫描降至 425 个 `any` token、84 处 `Record<string, any>`、64 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 467/467、`npm run check:native-ui`（319 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、0 warnings。主包 1559.3 KiB、adoption 分包 257.0 KiB、总包 3384 KiB，均低于硬上限但主包仍高于 1.5 MiB 质量建议线。
- 本批类型化投粮订单列表与工具栏：在 `orderMockApi.ts` 明确排序联合类型和选项契约；新增 `orderListMetadata.ts`，列表展示项从 `FeedingOrderItem` 派生，集中超时文案投影、状态徽标默认值和两组件响应式状态。组件消费共享 mock/API 类型，排序事件先经白名单窄化；保留原有筛选、排序、订单和显示文案，模板/样式未改。两组件移除 14 个 `any` token、2 处宽泛 `Record<string, any>` 与 2 个宽泛 `data()` 状态。metadata fixture 投影/隔离、排序窄化及源码守卫测试 3/3；全量源码扫描降至 411 个 `any` token、82 处 `Record<string, any>`、62 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 470/470、`npm run check:native-ui`（320 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、7 条既有 Vue 模板换行 warnings。主包 1559.3 KiB、feeding 分包 215.2 KiB、总包 3384.5 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。

- 本批类型化评审队列页与评审卡：新增 `packages/jury/services/queueMetadata.ts`，集中页面状态、评审业务类型/路由归一化和列表完成态投影；页面与卡片直接复用 `utils/juryMock.ts` 的 `JuryItem`、`JuryIdentity`、`JuryEvidence` 领域模型，不再各自定义 mock 类型。路由选项和兼容证据字段以 `unknown` 收窄，Props、响应式状态及 click/identity/evidence Emits 均有明确类型；保留已有评审数据、过滤/跳转行为和模板/样式。两 Vue 文件移除 17 个 `any` token、2 处宽泛 `Record<string, any>`，页面移除 1 个宽泛 `data()` 状态。新增状态隔离、路由别名、完成态投影及源码守卫测试 3/3；源码扫描降至 394 个 `any` token、80 处 `Record<string, any>`、61 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 473/473、`npm run check:native-ui`（321 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、9 条既有 Vue 模板属性换行 warnings。主包 1559.3 KiB、jury 分包 18.9 KiB、总包 3385.7 KiB，均低于分包硬上限；主包仍高于 1.5 MiB 质量建议线。
- 本批类型化救助“我的救助”列表：新增 `packages/rescue/services/mineMetadata.ts`，集中页面状态、筛选 tab、状态文案/tone 与计数；复用 `mineReader.ts` 的 `MineFilter`、`MineStatus`、`MineItem` 和只读持久化读模型。该个人列表没有本地演示 fixture，因此没有新增 mock 记录或破坏无数据时的 fail-closed 行为。页面的存储读取、服务参数、列表项与错误边界均使用明确类型/`unknown`，移除 `as any`；模板、样式和原有筛选/状态文案不变。页面移除 10 个 `any` token、1 处宽泛 `Record<string, any>` 和 1 个宽泛 `data()` 状态。新增 metadata 副本隔离、状态 whitelist/count 与源码守卫测试 3/3；源码扫描降至 384 个 `any` token、79 处 `Record<string, any>`、60 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 476/476、`npm run check:native-ui`（322 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、2 条既有 Vue 模板属性换行 warnings。主包 1559.3 KiB、rescue 分包 128.2 KiB、总包 3386.3 KiB，均低于分包硬上限；主包仍高于 1.5 MiB 质量建议线。
- 本批类型化领养审核列表：页面状态和 tab 由 `packages/adoption/services/reviewListMetadata.ts` 明确建模；列表记录复用审核契约结果、`AdoptionRecord` 持久化读取及共享 `createAdoptionReviewQueueCard`，不再定义页面私有 mock/view-model，也不加入演示记录。`adoptionReviewMetadata.ts` 增加持久化记录 ID 别名索引，并补齐评审团待审状态文案；审核详情的显示 mode 继续由已授权详情读模型从当前记录推导，不再依赖卡片传入的冗余 query mode。列表页移除 9 个 `any` token、1 处 `Record<string, any>` 和 1 个宽泛 `data()` 状态，模板和样式不变。新增记录别名、评审团状态、状态副本隔离与页面类型守卫测试 2 项；源码快照降至 375 个 `any` token、78 处 `Record<string, any>`、59 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 478/478、`npm run check:native-ui`（323 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、2 条既有 Vue 模板属性换行 warnings。主包 1559.5 KiB、总包 3385.1 KiB，均低于 2 MiB 硬上限；主包仍高于 1.5 MiB 质量建议线。
- 本批类型化领养“我的领养”列表：新增 `packages/adoption/services/mineMetadata.ts`，集中列表状态、路由参数解码与状态色调映射；页面数据直接复用 `AdoptionCard` 和 `toAdoptionCard`，演示/真实记录仍由共享 `adoptionStorage` 提供，不新增页面私有 mock 或改变默认演示数据来源。页面以类型守卫过滤无效记录，路由输入改为 `unknown` 并规范化，移除 8 个 `any` token、1 处 `Record<string, any>` 和 1 个宽泛 `data()` 状态；模板、样式、状态文案和导航目标保持不变。新增状态副本、路由窄化、状态色调白名单及源码守卫测试 3/3；源码快照降至 367 个 `any` token、77 处 `Record<string, any>`、58 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 481/481、`npm run check:native-ui`（324 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、4 条既有 Vue 模板属性换行 warnings。主包 1559.5 KiB、领养分包 256.2 KiB、总包 3385.7 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。
- 本批类型化账号任务列表：新增 `packages/account/services/taskListMetadata.ts`，集中待处理/已处理 tab、列表筛选、状态色调和角色标签；页面卡片复用 `taskPageModel.ts` 的投影、任务详情 resolver 和 `tasksRuntime.ts` 只读持久任务结果，没有引入页面自建 mock。页面状态、列表项及诊断使用派生类型，移除 6 个 `any` token、1 处 `Record<string, any>` 和 1 个宽泛 `data()` 状态；同时要求卡片 `taskId` 为非空字符串，拒绝缺失/错误的列表身份。模板、样式、筛选和路由行为不变。新增状态/tab 隔离、筛选/文案映射、无效 taskId 拒绝及源码守卫测试；源码快照降至 361 个 `any` token、76 处 `Record<string, any>`、57 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 483/483、`npm run check:native-ui`（325 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、2 条既有 Vue 模板属性换行 warnings。主包 1559.5 KiB、account 分包 444.0 KiB、总包 3386.2 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。
- 本批类型化动物品种选择页：新增 `packages/animal/services/breedPickerMetadata.ts`，集中猫/狗品种 mock、页面状态、路由弹层选项和 opener/input payload 的 `unknown` 窄化；页面不再保留私有品种数组或 `any` 回调，跨页 EventChannel 也经过运行时形状检查。移除 6 个 `any` token、1 处 `Record<string, any>` 和 1 个宽泛 `data()` 状态；模板、样式和已有补充弹层行为不变。新增 metadata clone、物种列表、路由/payload 窄化和源码守卫测试；源码快照降至 355 个 `any` token、75 处 `Record<string, any>`、56 个宽泛 `data()` 文件。`npm run typecheck`、定向 metadata/编辑器回归测试 5/5、全量治理测试 486/486、`npm run check:native-ui`（326 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、4 条既有 Vue 模板属性换行 warnings。主包 1559.5 KiB、动物分包 223.9 KiB、总包 3387.2 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。
- 本批继续类型化动物名册入口：新增 `packages/animal/services/rosterEntryMetadata.ts`，统一“我的宠物/我的云养宠物”的响应式状态、空态文案和 `unknown` 路由 userId 校验；两个入口的宠物点击复用 `YardPet`，院落点击复用 `PetRosterYardInfo`。移除 8 个 `any` token、2 处 `Record<string, any>` 和 2 个宽泛 `data()` 状态，不改模板、样式或导航目标。新增状态隔离、路由 ID 有效性和源码守卫测试 3/3；源码快照降至 347 个 `any` token、73 处 `Record<string, any>`、54 个宽泛 `data()` 文件。`npm run typecheck`、全量治理测试 489/489、`npm run check:native-ui`（327 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查和 `git diff --check` 均通过；定向 ESLint 0 errors/warnings。主包 1559.5 KiB、动物分包 224.3 KiB、总包 3387.6 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。
- 本批类型化动态媒体读取/展示边界：新增 `utils/dynamicMediaMetadata.ts`，集中媒体项、viewer projection、预览 payload 和 change 索引窄化；`DynamicMediaViewer.vue` 的 Props、状态、watch、事件和预览回调使用显式类型并声明带 payload 校验的 Emits。动态 reader 将持久化媒体输入收窄为可用字符串源，拒绝无效值。移除 viewer 的 6 个 `any` token、1 处 `Record<string, any>` 和 1 个宽泛 `data()` 状态，页面样式不变。新增媒体元数据/事件测试 3/3，并扩展 reader 回归；`npm run typecheck`、全量治理测试 493/493、`npm run check:native-ui`（328 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors/warnings。主包 1560.6 KiB、总包 3388.8 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。

- 本批类型化动态详情页：新增 `packages/dynamic/services/detailMetadata.ts`，集中页面状态、路由窄化以及小院/宠物/排行榜/投喂者/评论展示类型，并为 `reply-send` 补齐 Emits。页面移除 12 个 `any` token、1 处 `Record<string, any>` 和 1 个宽泛 `data()` 状态，模板结构与样式不变；新增 metadata 与源码守卫测试 3/3。全量快照为 329/71/52；typecheck、全量治理测试 496/496、native UI 检查、构建/包检查、定向 ESLint 和 `git diff --check` 均通过。主包 1560.6 KiB、动态分包 85.1 KiB、总包 3393.3 KiB。

- 本批类型化小院排行榜滚动链路：在 `utils/yardMock.ts` 增加 `YardRankScrollItem` / `YardRankScrollInput`、共享行项目规范化与类型守卫；`SeamlessScroll.vue` 复用共享排行榜契约并保留历史字符串标签输入，补齐状态和校验型 `user-click` Emits；`YardFeedRankStrip.vue` 改用 `YardRankItem[]` Props，并补齐带 payload 校验的 `rank-user` / `leaderboard` Emits。移除 7 个 `any` token、1 处宽泛 `Record<string, any>` 和 1 个宽泛 `data()` 状态；同时将 Vue 3 销毁钩子改为 `beforeUnmount`。新增 metadata/兼容性与源码守卫测试 2 项；全量快照降至 322/70/51，剩余未声明 Emits 降为 3 项。typecheck、全量治理测试 498/498、native UI 检查（329 个源码文件，5 条历史基线项）、构建/包检查和 `git diff --check` 通过；定向 ESLint 0 errors、4 条既有模板属性换行 warnings。主包 1562.1 KiB、动态分包 85.1 KiB、总包 3394.8 KiB，均低于硬上限；主包高于 1.5 MiB 质量建议线。

- 本批统一头像堆叠与基础展示组件的输入类型：新增 `utils/avatarStackMetadata.ts`，让 `YardFeeder`、动态投喂者和头像堆叠共用头像资料契约；同时为 Badge 偏移、Checkbox 尺寸、Divider 长度和语音柱数据指定真实类型。移除 6 个 `any` token，不改布局、样式或交互；全量快照降至 316/70/51。新增共享契约/源码守卫测试 2/2；`npm run typecheck`、全量治理测试 500/500、`npm run check:native-ui`（330 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、1 条既有模板属性换行 warning。主包 1562.2 KiB、动态分包 85.1 KiB、总包 3394.9 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。

- 本批类型化小院头像裁剪器：新增 `packages/yard/services/imageCropperMetadata.ts`，集中图像尺寸/导出路径规范化、响应式状态、拖动/双指缩放判别联合和裁剪矩形；组件从 uni 回调复用类型并校验未知触摸数据，给 `update:visible`、`confirm`、`cancel` 补上 payload Emits。移除 12 个 `any` token、1 处宽泛 `Record<string, any>` 和 1 个宽泛 `data()` 状态；未改模板布局或样式。新增 metadata 与源码守卫测试 3/3；快照降至 304/69/50。`npm run typecheck`、全量治理测试 503/503、`npm run check:native-ui`（331 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、5 条既有模板格式 warnings。主包 1562.2 KiB、小院分包 203.5 KiB、总包 3395.6 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。

- 本批类型化领养奖励订单地址表单：新增 `utils/rewardOrderMetadata.ts`，响应式状态复用 `AddressRecord`，未知存储地址先规范化，提交事件复用 `RewardOrderRecord` 并增加 payload 守卫；为 `update:modelValue`、`submitted`、`closed` 补齐校验型 Emits。移除 6 个 `any` token、1 处宽泛 `Record<string, any>` 和 1 个宽泛 `data()` 状态，不改模板布局或样式。新增 metadata 与源码守卫测试 3/3；快照降至 298/68/49。`npm run typecheck`、全量治理测试 506/506、`npm run check:native-ui`（332 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、3 条既有模板换行 warnings。主包 1563.0 KiB、领养分包 256.2 KiB、总包 3396.5 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。

- 本批类型化 `WhtNoticeBar`：新增 `components/WhtNoticeBar/noticeMetadata.ts`，集中主题/平台联合类型、状态初值和 selector rect 结果窄化；组件测量回调改用 `unknown` 输入和有类型的结果，补齐 `click`、`close` Emits，并移除未使用的 Vue 版本探测变量。移除 9 个 `any` token、3 处宽泛 `Record<string, any>` 和 1 个宽泛 `data()` 状态；未改模板布局或样式。新增 metadata/rect/source guard 测试 3/3；快照降至 289/65/48，未声明 Emits 降至 1 项。`npm run typecheck`、全量治理测试 509/509、`npm run check:native-ui`（333 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors、7 条既有模板/选项顺序 warnings。主包 1563.0 KiB、总包 3396.5 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。

- 本批继续处理 `components/an-notice-bar/an-notice-bar.vue`：新增 `components/an-notice-bar/noticeMetadata.ts` 为响应式状态提供显式接口与独立初值工厂，集中保留既有竖线分割语义，并声明 `more` Emits；不改模板布局、样式或交互。移除 1 个 `any` token 和 1 处宽泛 `Record<string, any>`，宽泛 `data()` 文件减少 1 个；快照降至 288/64/47，运行时 Emits 文件增至 82，未声明 Emits 清零。新增 metadata/source guard 测试 3/3；`npm run typecheck`、全量治理测试 512/512、`npm run check:native-ui`（334 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 通过。定向 ESLint 0 errors，保留 2 条既有模板变量遮蔽和选项顺序 warnings。构建主包 1563.0 KiB、总包 3396.5 KiB，均低于硬上限；主包仍高于 1.5 MiB 质量建议线。

- 本批类型化救助详情与证实组件：新增 `packages/rescue/services/componentMetadata.ts`，共享救助加载状态、基金列表/证实表单状态工厂、审核状态展示白名单和详情导航联合类型；五个 rescue 组件复用 `utils/rescueStorage.ts` 的 `RescueRecord`，证实列表复用导出的 `NormalizedRescueProof`，不再定义弱化的本地记录类型。`RescueApplicantInfoRow` 统一申请信息行并规范化未知 label/value，同时保留扩展字段；中央 demo fixture 使用 `RescueRecordMock` / `RescueProofMock` 种子契约并归一化为共享领域记录。移除 21 个 `any` token、8 处 `Record<string, any>`、2 个宽泛 `data()` 状态；全局快照降至 267/56/45。metadata/fixture/状态/行数据/source guard 测试 5/5，救助进度测试 8/8、证实流程测试 6/6。`npm run typecheck`、全量治理测试 517/517、`npm run check:native-ui`（335 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 通过；定向 ESLint 0 errors，10 条既有模板格式/属性顺序 warnings。主包 1563.1 KiB、救助分包 129.0 KiB、总包 3397.3 KiB，低于硬上限，主包仍高于 1.5 MiB 质量建议线。

- 本批类型化救助详情、证实、申请进度和结果页：五个页面状态改用共享工厂；四个记录页通过共享路由解析器收窄 `unknown` 参数，并将 MP-WEIXIN 解码边界集中在条件编译 helper 中，保留 H5 不解码和原路由白名单校验。进度读模型及 `RescueApplicantProgress` Props 使用显式的最小展示记录契约，不再把经脱敏的进度投影伪装成完整 `RescueRecord`。五页清除 `any` 注解和 `Record<string, any>`，移除 19 个 `any` token、5 处宽泛响应式状态；全局快照降至 248/51/40。路由输入/错误窄化与页面源码守卫测试 6/6，救助进度回归 8/8、证实流程 6/6；全量治理测试 518/518。`npm run typecheck`、`npm run check:native-ui`（335 个源码文件，5 条历史基线项）、小程序构建及包体积/资源/边界检查、`git diff --check` 均通过；定向 ESLint 0 errors，`RescueApplicantProgress.vue` 保留 5 条既有模板首属性换行 warnings。主包 1563.1 KiB、救助分包 129.4 KiB、总包 3397.7 KiB，均低于硬上限，主包仍高于 1.5 MiB 质量建议线。

- 本批类型化领养额度、助力和明细页：新增 `packages/adoption/services/quotaMetadata.ts`，集中支持者/额度流水/明细 fixture、联合 mode、独立页面状态工厂及路由别名归一化；三页不再各自重复 mock 类型与数据，保持原有 ID 优先级、无 ID 行为和不足额度弹层判定。移除 9 个 `any` token、3 处 `Record<string, any>` 与宽泛 `data()` 状态；快照降至 239/48/37。metadata fixture 隔离、路由输入与源码守卫测试 3/3，`npm run typecheck` 通过；metadata 与治理测试 ESLint 通过。三页模板原有不规则空白触发 3 个 ESLint errors、9 条既有属性换行 warnings，本批未改动模板文本或样式。
- 本批清零生产 Vue/TS 源码显式 `any`：为 App 启动路由参数和去重状态、微信事件/自定义 tab-bar、地址导入、设置菜单、投票事件及弹层响应式 setter 补齐具体类型；新增 `utils/pawEventMetadata.ts` 将小程序 `detail`/`dataset` 的未知输入集中窄化，避免为了统一事件形状污染 DOM `Event` 类型；删除不可达且会修改 props 的九宫格图片错误处理方法。将主包“我的”页共享 metadata 移至 `utils/mePageMetadata.ts`，清除 main → account 分包边界错误。TypeScript AST 全源码扫描（TS/TSX/d.ts/Vue scripts，排除 tests/docs/uni_modules/生成物）结果 0 个 `any` 节点、0 个 `Record<string, any>` 和 0 个宽泛 `data()` any 状态；新增事件 metadata 与全域 AST 守卫测试 2/2。`npm run typecheck`、全量治理测试 523/523、`npm run check:native-ui`（342 文件、5 条冻结历史基线）、`npm run build:mp-weixin` 与包体积/资源/边界检查均通过；主包 1565.0 KiB、总包 3404.1 KiB，均低于硬上限但主包仍高于 1.5 MiB 质量建议线。定向 ESLint 仍有 3 个既有模板/空白错误及格式 warnings。

### 4.3 优先建模领域

1. 账号/资料：Profile、Relation、Task。
2. 小院/动物：Yard、Animal、Roster、ManagementCapability。
3. 领养/救助：Application、Review、RescueRecord、StatusAxis。
4. 投喂/订单/反馈：Order、FeedbackEvidence、Visibility。
5. 导航与深链：Route、DeepLink、SelectorBridge、WeixinLoadOptions。

## 5. Props / Emits 状态

历史检查记录未发现缺少 runtime `emits` 声明的事件；该结论仅覆盖事件名称。2026-09-23 类型契约复核发现的 57 处数组式声明现已全部改为有 tuple payload 类型的事件 map（见 TS-R04 整改记录）。`eventContract` 为 Vue 提供编译期参数签名，不承担原始输入校验；外部数据仍须在解析边界校验。后续新增 `$emit` 时同步维护名称和参数契约。

TS-R04 涉及的公告 `items` 已改用共享公告输入模型。2026-09-24 对 `components/`、`packages/` 和 `pages/` 重新执行 Props 规则检查后，required/default 冲突、缺失默认值和 mutating props 均为 0；当时记录的 9 项冲突、6 项缺省值和 1 项可变性风险已关闭。

旧 `PropType` 快照中的 46 个文件已使用具体业务类型或明确数组元素类型。当前未发现 `PropType<any>`、`PropType<unknown>`、裸 `object` / `Array` 类型；样式映射保留显式 `Record<string, string | number | undefined>`。

## 6. 工具检查快照

| 检查 | 结果 | 说明 |
| --- | --- | --- |
| `npm run typecheck` | 通过 | 当前 TS/Vue 类型检查无错误 |
| `npm run build:mp-weixin` | 通过（2026-09-25） | 主包 1577.9 KiB、总包 3418.5 KiB；包体积/资源/边界检查通过；主包仍高于 1.5 MiB 质量建议线 |
| `npm run test:governance` | 528/528 通过（2026-09-25） | 包含共享合同编译期正反例、存储边界、评论作者兼容、付款参数 helper 和 unknown 边界基线测试 |
| `npm run check:native-ui` | 通过（2026-09-25） | 345 个源码文件扫描，5 条历史基线项 |
| 改动相关文件 ESLint | 0 errors，49 warnings（2026-09-25） | warnings 来自既有模板属性换行/顺序及组件选项顺序 |
| `npm run lint` | 未通过（2026-09-25） | 全仓 21 errors、501 warnings，分别涉及 14/113 个文件；错误分布和未解决项见第 12 节 |
| `npm run format:check` | 未通过（2026-09-25） | 全仓 541 个文件有格式差异；本轮新增的 unknown 治理脚本、测试和快照单独检查通过，未对其余文件做批量重写 |
| `git diff --check HEAD` | 通过（2026-09-25） | 本轮清理 12 个受影响路径的混合 CRLF、行尾空格和多余 EOF 空行 |

## 7. 完成判定

本台账全部关闭需要同时满足：

- [x] 97 个第一方业务运行时 JS 文件完成 `.ts` 迁移并删除旧文件；44 个是 `navigation + utils + custom-tab-bar` 核心子范围，另有 53 个补充模块。
- [x] 生产源码不再引用待迁移的 `.js` 模块。
- [x] `tsconfig.json` 关闭 `allowJs`。
- [x] TS/Vue/d.ts 源码中的 `@ts-nocheck` 全部完成收窄并移除；`@ts-ignore`/`@ts-expect-error` 保持为 0。
- [x] 生产 Vue/TS 源码无显式 `any` AST 节点，且无宽泛 `Record<string, any>` / 响应式状态 `any`。
- [x] Props 使用具体数据类型；required/default 冲突、缺省值和 mutating props 风险均已清零。
- [x] 1 个未声明 Emits 全部补齐。
- [x] TS-R01～TS-R03：共享实体/DTO、mock 请求响应及存储记录类型闭合，错误业务参数和字段名可被编译器拒绝。
- [x] TS-R04：公告 Props 与组件事件载荷明确建模；57 处数组式 emits 已转换，目标页面事件处理使用明确 payload 类型；全量回归发现的其他接收端残项列于 TS-R06。
- [x] TS-R05：工具回调与返回值通过泛型保留类型，消费者可推断已知业务结果。
- [x] TS-R06～TS-R08：已知事件和页面内部入参收窄；投喂、可见性、救助审核 API 补齐输入/回调类型；生产深链结果返回 `DeepLinkResolution`。
- [x] `npm run typecheck`、`npm run build:mp-weixin`、治理测试及 `check:native-ui` 静态护栏通过；DevTools 运行时检查见第 12 节，仍待补验。
- [ ] Lint 和 Prettier 债务完成清理，或在单独审计台账中明确冻结范围；当前全仓检查仍失败，不能标记为完全验收。

## 8. 2026-09-23 共享数据契约与 unknown 专项复核

### 8.1 审查范围与结论

审查对象为当时的当前工作区，包含已暂存、未暂存及未跟踪的 TS 改造文件。重点检查本地 mock 的共享数据定义、页面/组件 Props、事件、工具入参与出参，以及业务层 `unknown` 的传播。本次仅记录问题，未实施以下整改。

结论：严格类型检查通过、显式 `any` 清零已经完成，但不代表共享数据契约完整。已有类型主要分布在 mock、storage 和 metadata 文件中，尚未形成类似 OpenAPI 的统一请求/响应契约并贯穿消费者。数据库实体、接口 DTO 与页面展示模型应分别建模并明确映射，不要求三者使用同一形状；也不以是否存在 OpenAPI 文件作为唯一验收标准。

以下五项记录的是 2026-09-23 审查时的 P2 类型约束缺口；现行状态和整改证据见第 8.5 节。历史章节中的“已迁移已验证”仍表示迁移阶段检查通过，不表示本节问题已经关闭。

### 8.2 问题台账

#### TS-R01 — API 返回结果丢失已定义的领域记录类型

- 优先级 / 状态：P2 / 已整改（2026-09-24）。
- 位置：`utils/applicationMockApi.ts` 的 `ApplicationView`（审查时第 78 行）、`getApplication`、`getApplicationStatus`；消费者 `packages/adoption/components/PawAdoptionEvidence.vue` 的 `loadRecord`（第 144 行）。
- 发现：`ApplicationView` 仅明确 `id`、`applicationType`，其余字段通过 `Record<string, unknown>` 放行；`getApplicationStatus` 的 `status` 也为 `unknown`。即使指定领养业务，返回值仍不能保留 `AdoptionRecord` 的具体字段，下游重新以 `unknown` 解析。
- 影响：API 字段拼写、业务类型与数据形状之间的对应关系不能被完整检查，页面需要重复规范化已知结果。
- 整改：建立共享请求/响应 DTO；用可辨识联合、重载或泛型关联业务类型与返回记录；读取适配器返回明确的授权投影类型，不把脱敏投影冒充完整存储实体。
- 验收：成功分支可直接读取已声明字段；领养/救助类型可正确收窄；错误字段名被编译拒绝；mock、服务和页面复用该契约，无重复弱化定义。

#### TS-R02 — mock 请求参数以 unknown 放行错误业务输入

- 优先级 / 状态：P2 / 已整改（2026-09-24）。
- 位置：`utils/petRosterMockApi.ts` 的 `PetRosterParams`（第 15 行）；`utils/applicationMockApi.ts` 的 `createApplication`（第 285 行）；同类复核入口为 `utils/feedingOrderMockApi.ts` 的 `FeedingOrdersOptions`。
- 发现：已存在 `PetRosterVariant`、`PetRosterSpecies`，但请求字段仍为 `unknown`；申请 API 的业务类型、payload、patch 等同样缺少调用方约束。
- 影响：错误枚举、布尔值被写成对象、宠物列表被写成数字等问题可通过编译，只能在运行时拒绝或兜底。
- 整改：公开业务方法使用明确的请求类型、状态联合和更新 DTO；外部原始输入由独立解析入口以 `unknown` 接收并校验，保留已有运行时防御。
- 验收：本节错误调用样例必须产生类型诊断；合法请求通过；路由/缓存/网络边界仍有异常输入测试。

#### TS-R03 — 存储实体仍有开放字典与未定义业务字段

- 优先级 / 状态：P2 / 已整改（2026-09-24）。
- 位置：`utils/adoptionStorage.ts` 的 `AdoptionRecord`（第 20 行）、`normalizeAdoptionRecord`；`utils/rescueStorage.ts` 的 `RescueRecord`（第 42 行）。
- 发现：核心记录继承 `Record<string, unknown>`；领养 `status` 为任意字符串、`mediaPaths` 为 `unknown[]`、重新审批时间为 `unknown`；救助状态及时间也未完整收紧。领养媒体解析仅检查数组，未验证元素。
- 影响：字段拼写错误不会在访问处被拒绝，非法媒体元素可进入规范化记录，状态和时间缺少统一语义约束。
- 整改：明确状态联合、时间格式、媒体结构及持久化可选字段；移除核心实体兜底索引签名。历史数据兼容放在解析层，合法扩展数据如确有需要单独定义扩展容器。
- 验收：规范化输出不含未知业务字段类型；非法状态/媒体/时间输入被拒绝或按明确策略兼容；历史读取和状态机回归通过；实体、DTO、展示模型之间映射可检查。

#### TS-R04 — Props 与事件载荷未完全闭合

- 优先级 / 状态：P2 / 已整改（2026-09-24）。
- 位置：`components/PawAnnouncementMarquee.vue` 的 `items`（第 64 行）及 `finished` / `click`；`components/navigation/PawSearchBar.vue` 的 `emits`（第 31 行）；`packages/adoption/pages/progress/index.vue` 的 `onPrimaryAction`（第 96 行）。
- 发现：公告 `items` 为 `unknown[]`，事件载荷为 `unknown`，没有复用已有公告契约。检索 `components/`、`packages/` 的 Vue 文件得到 57 处数组式 `emits` 声明；该数量是文本检索快照，不等于 57 个独立运行时缺陷。内部页面动作也仍以 `unknown` 接收。
- 影响：事件名称已声明，但错误 payload 不能被完整静态检查；父子组件间的类型链路断开。
- 整改：Props 使用明确输入类型（包含必要的历史兼容联合）；逐项定义事件参数；页面处理内部事件时复用载荷类型；网络/socket 原始输入单独解析。
- 验收：错误 Props 和事件载荷在类型检查中失败；父组件处理函数可直接使用事件字段；无参数事件有明确的无参数签名；保留运行时边界校验。

#### TS-R05 — 工具回调与返回值退化为 unknown

- 优先级 / 状态：P2 / 已整改（2026-09-24）。
- 位置：`navigation/actorCapabilities.ts` 的 `CapabilityCallback`、`readPrivate`（第 574 行）、`writeWithCapability` 及 evaluator 包装方法。
- 发现：reader/writer 参数为 `unknown`，返回值也为 `unknown`；检查 `typeof callback === 'function'` 只能确认可调用，无法表达业务对象与结果的类型关联。
- 影响：调用方无法保留 reader/writer 的具体返回类型，需要再次解析或断言。
- 整改：以泛型关联已验证的业务对象、授权上下文、回调参数和结果；公开方法使用回调签名，原始对象解析与授权校验保留在边界。
- 验收：传入具体 reader/writer 后能推断对应结果类型，错误回调/结果使用被编译拒绝；拒绝授权时仍不执行回调，既有权限与零写入测试通过。

### 8.3 复核当时的验证证据（历史快照）

| 检查 | 本次结果 | 证明范围 |
| --- | --- | --- |
| `npm run typecheck` | 通过 | 当前声明可通过严格编译，不证明契约精度 |
| `node --test tests/governance/paw-event-and-explicit-any.test.cjs` | 2/2 通过 | 事件输入解析及生产源码无显式 `any` AST 节点 |
| TypeScript 内存编译探针 | 以下错误样例在探针文件中产生 0 条诊断 | 复现公开 API 接受错误参数及开放字典接受拼错字段；未执行这些业务调用，未写入业务数据 |
| 全量治理测试 / 小程序构建 / native UI / 模拟器 | 本次审查未重跑 | 第 6 节保留的是此前迁移验证快照，不是本次重新验收结果 |

探针使用项目 `tsconfig.json` 的编译选项、`env.d.ts` 以及内存源文件，由 TypeScript Compiler API 检查以下代码：

```ts
import { createApplication, getApplication } from './utils/applicationMockApi'
import { getPetRoster } from './utils/petRosterMockApi'

createApplication('adoptoin', { pets: 123, mediaPaths: [false] })
getPetRoster({ species: 'dragon', managed: { oops: true } })
const result = getApplication('adoption', 'test')
if (result.success) {
  const misspelled = result.data.stauts
}
```

后续应建立编译期负例测试，断言错误调用确实产生诊断，同时验证合法请求、返回类型推断及组件载荷。不要仅通过扫描 `any` / `unknown` 字符串或绕过类型检查来验收。

### 8.4 整改顺序与 unknown 使用边界

1. 先定义共享实体、状态与请求/响应 DTO（TS-R03、TS-R01）。
2. 收紧 mock/服务公开请求签名，补齐输入边界解析（TS-R02）。
3. 补齐组件 Props/emits，页面复用领域或展示类型（TS-R04）。
4. 用泛型保留工具回调与结果类型（TS-R05），补充编译期正反例及相关运行时回归。

- 已知业务状态、Props、内部事件、函数回调与服务成功结果不应使用 `unknown` 兜底。
- 路由、缓存、网络原始输入及 `catch` 异常可使用 `unknown`，但校验完成后必须输出明确类型，避免向业务层继续传播。
- 可靠的类型推断属于有效类型定义，不要求所有局部函数机械补写返回注解。
- 不以 `any`、双重断言、开放字典或删除运行时校验来减少 `unknown` 数量。
- 本节五项均已在 2026-09-24 完成；新增文件、行为和验证证据如下。

### 8.5 整改记录（2026-09-24）

| 条目 | 整改内容 | 主要文件 | 状态 |
| --- | --- | --- | --- |
| TS-R01 | 新增共享领养/救助记录、API 输入与结果 DTO；mock API、授权投影及页面服务复用对应类型，成功响应按业务类型保留记录形状。 | `contracts/applications.ts`、`contracts/adoptionProjection.ts`、`utils/applicationMockApi.ts`、`packages/adoption/services/applicationAdapter.ts`、`services/domainReads/adoption/applicationAdapter.ts` | 已关闭 |
| TS-R02 | 收紧领养申请、宠物名册、投喂订单查询参数和更新 patch；错误枚举/字段在类型检查中拒绝。原始存储值仍在解析入口接收为 `unknown` 并校验。 | `contracts/applications.ts`、`utils/applicationMockApi.ts`、`utils/petRosterMockApi.ts`、`utils/feedingOrderMockApi.ts` | 已关闭 |
| TS-R03 | 领养/救助存储实体改用无开放索引签名的共享契约；明确状态和时间类型，校验媒体路径/时间并为无法识别的历史状态映射 `unknown` 状态哨兵，保留诊断与历史兼容。 | `contracts/applications.ts`、`contracts/applicationParsing.ts`、`utils/adoptionStorage.ts`、`utils/rescueStorage.ts` | 已关闭 |
| TS-R04 | 公告 Props 复用共享 metadata；57 处数组式 emits 改为带 tuple 参数的事件映射。页面事件接收端和相关组件 Props 已按真实载荷收紧。编译期反例覆盖合法/非法 Props、事件名、载荷和回调结果。事件 helper 提供静态签名，不替代外部输入运行时校验。 | `components/PawAnnouncementMarquee.vue`、`utils/announcementMetadata.ts`、`utils/componentEvents.ts`、`components/` 与 `packages/` 中的事件消费方、`tests/governance/ts-shared-contracts.test.cjs` | 已关闭 |
| TS-R05 | 权限 reader/writer 及 evaluator 包装器以泛型保留对象、上下文和结果类型；拒绝权限仍不调用回调。 | `navigation/actorCapabilities.ts`、`packages/adoption/services/actorCapabilities.ts` | 已关闭 |
| Props 规则 | 将带默认值的 NineGrid Props 改为可选签名；为两个结果组件的可选文案 Props 提供空字符串默认值。全仓 required/default、缺少默认值和 mutating-props 规则扫描为 0。 | `components/libai-NineGridLayout/libai-NineGridLayout.vue`、`components/PawFlowResult.vue`、`packages/dynamic/components/PawSuccessOverlay.vue` | 已关闭 |

编译期专项测试通过合法消费者代码，并确认错误业务枚举、拼错字段、错误事件载荷和不兼容回调结果都会产生 TypeScript 诊断；存储测试覆盖媒体路径、时间和非法状态输入。`npm run typecheck` 通过，全量治理测试 525/525，通过 `npm run check:native-ui`（344 个源码文件，5 条历史基线项），`npm run build:mp-weixin` 与包体积/资源/边界检查通过。本轮未暂存修复差异的 `git diff --check` 通过；完整 `git diff --check HEAD` 仍提示已暂存迁移文件有 CRLF 行尾空白，涉及 10 个既有文件。数组式 emits 扫描为 0。本次改动文件 ESLint 无错误，仍有 211 条模板格式和属性顺序警告。

类型收紧不表示业务代码中完全没有 `unknown`：本地存储/路由/原生 API/socket 输入、权限策略对象和异常等未验证边界继续用 `unknown`，并在解析或授权后收窄成具体模型。历史 Props 默认值/required 冲突和 mutating props 条目现已全部关闭；全仓 lint 与格式化仍有另列的历史债务。

## 9. 2026-09-24 TS 类型回归复核（整改前快照）

### 9.1 盘点结果

- 以 TypeScript AST 解析 353 个生产 TS/Vue 源文件，显式 `any` 类型节点为 0，与治理测试一致。
- 整改前同一范围有 2390 个 `unknown` 类型节点，其中 Vue SFC 脚本 301 个，分布于 92 个 SFC。这个数字是语法节点数，不代表同等数量的问题；其中包括类型守卫/规范化入口、持久化读取、路由参数、原生 API 回调、异常、权限 actor 和被复用的服务边界类型。
- 整改前 286 个导出函数签名至少包含一个 `unknown`。很多是 `normalize*`、`parse*`、`is*` 等原始输入边界；审查确认仍有部分业务命令和已知响应形状把 `unknown` 暴露给消费者。
- `strict: true` 与 `vue-tsc` 能拒绝隐式 `any`，但不能阻止显式 `unknown` 出现在公开业务 API 或已知事件消费端。当前专项治理测试禁止生产源码显式 `any`，没有为公开 API 的 `unknown` 使用维护边界 allowlist。

### 9.2 新增欠缺项

#### TS-R06 — 已知事件载荷和页面内部入参在消费端退化为 unknown

- 优先级 / 状态：P2 / 整改前待整改；已完成，见第10节。
- 位置：事件消费端包括 `components/PawPetRoster.vue` 的 `onSearch(value: unknown)`（`PawSearchBar` 发出 `string`）；`components/feeding/PawFeedingOrderToolbar.vue` 和重复实现 `packages/feeding/components/PawFeedingOrderToolbar.vue` 的 `selectSort(key: unknown)`（`PawPopoverMenuSelection`）；`packages/feeding/components/PawFeedingOrderList.vue` 的 `onSearch(value: unknown)`（工具栏发出 `string`）；`components/adoption/PawRewardOrderSheet.vue` 的 `onAddressSelected(address: unknown)`（`AddressRecord`）；`packages/adoption/pages/reward/claim/index.vue` 的 `onSubmitted(payload: unknown)`（`RewardOrderSubmittedPayload`）；`packages/animal/pages/detail/index.vue` 的 `previewPetImage(payload: unknown)`（组件已声明 `{ current: string; urls: string[] }`，页面本地调用另传 `string`）；`components/dynamic/DynamicMediaViewer.vue` 的 `onChange(event: unknown)`（swiper change event）。
- 其他已知页面/原生事件入口还包括 `packages/adoption/pages/review/list/index.vue` 的 `selectTab(tab: unknown)`、`packages/adoption/pages/mine/index.vue` 的 `statusTone(tone: unknown)`、`packages/account/pages/profile/index.vue` 的 `onMoreSheet(action: unknown)`、`packages/account/pages/tasks/index.vue` 的 `statusTone(status: unknown)` / `roleLabel(role: unknown)`、`packages/animal/pages/detail/index.vue` 的 `refreshAnimal(requestedPetId: unknown)`、`packages/dynamic/pages/editor/index.vue` 的 `hydratePersistentAnimals(yardId: unknown)` / `selectOrderById(...)`，以及 `PawRewardOrderSheet.fail(message: unknown)`、`packages/yard/pages/create/components/form/PawImageCropper.vue` 和 `packages/animal/pages/breed-picker/index.vue` 的触摸/输入事件接收函数。应把可从本地 DTO、调用点或原生事件签名确定的参数纳入整改；route options、eventChannel 原始 payload、存储解析、异常等真正的输入边界继续用 `unknown` 并校验。
- 影响：组件虽已有准确 `emits` 契约，父级方法和页面内部调用仍可退化为宽泛 `unknown`；这允许调用方传入任意值，也让字段访问与签名不再由编译器约束。
- 整改：事件处理函数从子组件导出 payload 类型或共享事件模型派生类型；原生回调使用 `UniApp` 事件 DTO；页面内部 helper 参数沿用已解析的领域类型。保留必要运行时防御，但把校验器与已知数据消费签名分开。
- 验收：父级处理函数与 emit 载荷相连；传入错误字段/类型的 handler 在编译期失败；route/eventChannel 等原始跨页事件仍先以 `unknown` 校验。

#### TS-R07 — 部分 mock 与领域命令仍接受任意 unknown 入参

- 优先级 / 状态：P2 / 整改前待整改；已完成，见第10节。
- 位置：`utils/feedingOrderMockApi.ts` 的 `getFeedingOrderDetail`（`type`、ID 和筛选字段均为 `unknown`）；`packages/feeding/services/orderVisibilityStorage.ts` 的 `setOrderHidden` / `hideOrderForUser`（订单 ID、布尔状态和 options 均为 `unknown`）；`packages/rescue/services/reviewActionAdapter.ts` 的 `readRescueReviewList`、`readRescueReviewDetail`、`applyRescueReviewAction`（options 为 `unknown`，且 `ReviewWriter` 是 `(context: unknown) => unknown`）。相同设计也存在于低层 `adoptionStorage` / `rescueStorage` 的新增、更新 patch 方法中。
- 证据：临时 `vue-tsc` 消费者把无效投喂 perspective、对象型 ID、字符串 hidden 状态、错误救助审核结果和非函数 writer 传给上述 API，未产生类型诊断；运行时仍会校验或回退，因此这是静态合同缺失，不是已证实的运行时安全绕过。
- 整改：为业务命令导出具体 options/input/patch 类型与可辨识结果；把接受任意存储/历史输入的入口保留为明确的 `parse/normalize` 边界。writer 的上下文应建模为审查记录集合、当前/下一记录及可信 actor；返回值按调用方是否消费定义为 `void` 或明确结果。
- 验收：错误业务枚举、对象 ID、布尔字段、patch 字段和 callback 签名由负例测试证明被拒绝；运行时输入守卫与 fail-closed 行为继续通过。

#### TS-R08 — 生产深链解析器返回 unknown，隐藏已知结果类型

- 优先级 / 状态：P2 / 整改前待整改；已完成，见第10节。
- 位置：`navigation/productionDeepLinkResolver.ts` 的 `ProductionDeepLinkResolver.resolve/resolveMessage/resolveTask` 和 `resolveProductionDeepLink` 都返回 `unknown`；底层 `navigation/deeplinkContracts.ts` 的 `resolveDeepLink` 已返回固定的 `DeepLinkResolution` 结构。
- 证据：临时消费者读取 `resolveProductionDeepLink(...).status` 时编译器报 TS18046，提示结果类型为 `unknown`。
- 整改：导出深链解析结果 DTO，或以 `ReturnType<typeof resolveDeepLink>` 关联生产解析器返回值；原始输入及 reader 返回值继续在解析边界保持 `unknown`。
- 验收：消费者能直接访问 `status`、`target`、`record` 并按 `status` 收窄；错误结果字段名在编译期失败。

### 9.3 整改前回归验证

| 检查 | 结果 |
| --- | --- |
| TypeScript AST 显式 `any` / `unknown` 盘点 | `any`：0；`unknown`：2390 个类型节点，见 9.1 |
| `npm run typecheck` | 通过 |
| `npm run test:governance` | 525/525 通过 |
| `npm run check:boundaries` | 通过 |
| TS 临时消费者探针 | 整改前证明 TS-R07 错误输入可编译；TS-R08 的已知结果被视为 `unknown` |

整改前临时消费者证明 TS-R07 错误输入当时可编译，TS-R08 已知结果当时被视为 `unknown`。整改保留了原始输入校验与 fail-closed 行为。

## 10. TS-R06～TS-R08 unknown 收紧整改

### 10.1 组件事件与页面内部函数

- 将搜索、排序、地址选择、奖励提交、动物预览、swiper 变更、评审页签、操作菜单、任务展示、触摸/输入等已知载荷改为具体组件 DTO、领域类型或 `PawEvent`。
- 页面内部传递的动物 ID、发布编辑器 yard/order ID 改为已解析的字符串类型；领养状态展示和订单失败提示使用具体展示/错误消息类型。
- 保留 `onLoad` 路由参数、eventChannel 原始载荷、存储读取及异常处理中的 `unknown`，并继续通过解析函数校验。

### 10.2 公开业务 API 与深链结果

- 投喂 mock 的详情参数以及共享投喂 service 的 perspective、variant、sort 使用共享合同类型；保留 `owner`、`yard` 等现有输入别名并在输出中规范化。
- 订单可见性 API 使用 string ID、boolean hidden 和 `OrderVisibilityOptions`；救助审核 list/detail/action 使用具体筛选、身份、ID、审核结果以及 reader/writer 类型。writer 上下文明确提供当前/下一条记录、记录集合、可信 actor、动作和幂等键。
- 生产深链解析器的输入仍是原始 `unknown`，其 resolve 系列返回已有 `DeepLinkResolution` DTO，消费者可以读取并收窄 `status`、`target` 和 `record`。
- adoption/rescue 低层 storage 的 raw record/patch 正常化入口继续接收 `unknown`；业务页面通过有 DTO 的 application API 调用，解析器负责验证持久化或历史输入。

### 10.3 整改后盘点与验证

| 检查 | 结果 |
| --- | --- |
| TypeScript AST（353 个生产 TS/Vue 文件） | 显式 `any`：0；`unknown`：2308 个类型节点，其中 Vue SFC 276 个，分布于 84 个文件；较整改前减少 82 个节点 |
| 编译期共享合同正反例 | 错误投喂参数、可见性 ID/boolean/options、救助筛选/审核 action/writer 和深链结果字段均被拒绝 |
| `npm run typecheck` | 通过 |
| `npm run test:governance` | 525/525 通过 |
| `npm run build:mp-weixin` | 通过；main 1576.3 KiB，低于 2048 KiB 硬限制，高于 1536 KiB 质量建议 |
| 包资源与边界检查 | assets 793 files / 970 references 通过；生产与源码边界通过 |
| `git diff --check` | 通过 |

## 11. 2026-09-24 再检查：其余公开 unknown

### 11.1 TS-R09 — mock 与本地服务的已知标量参数仍使用 unknown

- 优先级 / 状态：P2 / 已完成。
- 位置：地址 mock 的地址 ID，实名状态 mock 的 boolean 值，Jury mock/storage 的 item ID、投票值、状态、列表项及配置覆盖值；本地 profile 的 user ID/编辑 patch；投喂订单与奖励订单查询 ID；领养/救助按 ID 查询入口。
- 整改：为这些签名补充 string、boolean、`JuryVote`、`JuryItemStatus`、`JuryMockConfigOverrides`、`LocalProfilePatch` 等既有领域类型；原有运行时 ID、投票、存储数据校验保持不变。深链和 storage 内部调用先把原始值归一化/拒绝，再调用类型化查询函数。
- 验收：共享消费者正反例覆盖非法 ID、投票值、状态、配置字段、profile patch 和实名状态；`vue-tsc` 通过。

### 11.2 TS-R10 — 管理/编辑适配器的业务命令参数仍以 unknown 暴露

- 优先级 / 状态：P2 / 已完成。
- 位置：`packages/account/services/managementAdapter.ts` 的 `readProfile`、`readYard`、`readAnimal`、`readManagementResource`、`readManagementResourceWithReader`、`createManagementAdapter`；`packages/account/services/managementMutationAdapter.ts` 的 `updateManagementResource` 与 `updateProfile`/`updateYard`/`updateAnimal`；`packages/account/services/managementEditorRuntime.ts` 的 `readEditorResource` / `saveEditorResource`。这些入口的资源种类、领域 ID、options、patch 和读写器回调已有运行时验证或固定形状，但公开参数仍宽泛。
- 影响：页面或 service 消费者可把错误资源名称、对象型 ID、不兼容 patch 或错误 reader/writer 传进适配器，编译器无法在调用处提示；运行时仍会 fail-closed，因此属于静态合同欠缺，不是已证实的授权绕过。
- 整改：导出资源类型、ID route、read options、policy、reader locator/map、结果 DTO、按 profile/yard/animal 区分的 patch/writer 上下文及编辑器 options；写入 callback 结果改为 `void | boolean | Record<string, unknown> | null`，适配器拒绝字符串/数字等无效确认值。actor provider 的会话值和 reader 持久化返回值继续作为原始边界输入校验。
- 验收：共享消费者正反例覆盖错误 resourceType、ID、route locator、options、reader/writer 与资源 patch；管理 read/write fail-closed、授权专项测试通过；`npm run typecheck` 通过。

### 11.3 TS-R11 — 本地管理 API、编辑 gate 与组件公开方法仍以 unknown 暴露

- 优先级 / 状态：P2 / 已完成。
- 位置：`packages/yard/services/localManagementStorage.ts`、`packages/animal/services/localManagementStorage.ts` 的 ID、读写 options 和 patch；`packages/yard/services/managementEditorGate.ts`、`packages/animal/services/animalManagementEditorGate.ts` 的资源/ID/options；`packages/feeding/components/feedback/PawToast.vue` 的公开 `show` 方法。
- 整改：ID 改为 string；导出 storage/options/result 和 yard/animal patch DTO，动物创建输入要求 name、breed 并约束 species；gate resource 参数改为对应字面量。动物编辑页曾额外提交 allowlist 不支持的 `birthday` 字段，现只提交其已支持的 `birthValue`。
- 整改：`PawToast.show` 的 message/duration 参数分别改为 string/number。
- 验收：编译期正反例覆盖合法 ID/patch、错误字段/species、跨资源 gate、缺少创建必填字段及错误 Toast 参数；本地 storage、editor gate、TS shared contract 测试通过；`npm run typecheck` 通过。

### 11.4 TS-R12 — 其他业务 reader/list 命令 options 仍以 unknown 暴露

- 优先级 / 状态：P2 / 已完成。
- 位置：`services/domainReads/adoption/applicationAdapter.ts` 与 `packages/adoption/services/applicationAdapter.ts` 的按 ID 读取/resolver；`services/domainReads/adoption/reviewAdapter.ts` 的审核列表/详情；`services/domainReads/rescue/stateAdapter.ts`、`services/domainReads/rescue/lists.ts`；`packages/account/services/taskAdapter.ts`；`packages/dynamic/services/reader.ts`、`packages/dynamic/services/orderPicker.ts`；`packages/feeding/services/orderRuntime.ts` 与 `feedbackAdapter.ts`；`packages/rescue/services/proof.ts` 的提交命令。
- 影响：这些导出项接收稳定的业务 ID、筛选、actor provider 或 resolver，却将其中部分参数留作 `unknown`，导致调用方难以得到完整的编译期约束；其中 resolver 原始记录结果和可信会话内容仍适合保留 `unknown` 并在边界收窄。
- 整改：补充 domain-specific ID、options、resolver/writer context 和读取结果类型；reader 原始持久化行、actor session 与异常只在窄化边界保留 `unknown`。`taskPageModel.ts` 的任务 summary、角色、动作和状态改为共享 union contract。
- 验收：编译期正反例覆盖错误 ID、筛选值、options key 与 resolver 参数；`npm run typecheck` 和 526 项治理测试通过。

### 11.5 TS-R13 — mock/storage 和结果 DTO 的已知字段仍使用 unknown

- 优先级 / 状态：P2 / 已完成。
- 位置：`utils/adoptionStorage.ts`、`utils/rescueStorage.ts` 的公开写入/状态流转命令；`utils/feedingOrderMockApi.ts` 的订单展示 DTO；`utils/yardMock.ts` 宠物 ID 查询；`utils/regionMock.ts` 区域名称列表；`utils/rewardOrderStorage.ts` 订单列表写入；`navigation/orderContracts.ts` 奖励订单保存命令；`packages/feeding/services/orderAdapter.ts` 失败结果的 `data`。
- 整改：公开 adoption/rescue 写入和流转命令改用已知 ID、领域状态、patch 与 proof submission；原始 JS/mock 输入继续走明确命名的 `*FromUnknown` 归一化入口。投喂订单 `petTags`、排序字段、详情 DTO、区域路径和奖励订单保存回调补齐具体类型；订单读取失败载荷改为按 `OrderResult<T>` 保持对应 DTO 类型。
- 验收：共享消费者正反例覆盖错误 status、字段、ID、标签、区域名称、奖励订单 payload、writer callback 和错误结果 DTO；`npm run typecheck`、`npm run test:governance`（526/526）、`npm run build:mp-weixin`、包资源/边界检查和 `git diff --check` 通过。构建包体积 1576.7 KiB，低于硬限制但高于 1.5 MiB 质量建议线。

### 11.6 TS-R14 — 状态展示与订单合同的已知参数仍使用 unknown

- 优先级 / 状态：P2 / 已完成。
- 位置：领养/救助状态展示与投粮工具栏状态工厂的已知标量入参；`navigation/orderContracts.ts` 的礼品订单查询、关联 key、用户可见性 key/查询和订单动作判断。
- 影响：页面及领域消费者即使持有明确状态、订单记录和 actor 类型，也无法在编译期约束这些 helper 的入参。
- 整改：展示辅助函数改为 string、状态 union 或 FeedingOrderSort；订单 helper 改为 OrderRecord、OrderActor、OrderOperation、VisibilityEntry 与 string ID。原始订单/会话和历史可见性数据仍由 `getOrderAccess`、`normalize*` 及内部 `*FromUnknown` 边界校验；运行时 fail-closed 检查保留。
- 验收：共享消费者正反例覆盖有效订单/ID/状态/排序及非法类型；7 个相关治理测试文件 32/32 通过，`npm run typecheck` 通过。

### 11.7 TS-R15 — 已知回调与筛选选项的公开类型仍退化为 unknown

- 优先级 / 状态：P2 / 已完成。
- 位置：actor provider、reader/resolver/authorizer、任务 resolver map、订单读取 options、救助筛选、反馈策略/时间选项和反馈任务访问 helper；领养 transition map 仍以 unknown 接收。
- 影响：调用方即使持有明确的回调、筛选值、策略、时间或订单查询字段，仍可能传入对象/数字等错误类型，编译器无法在调用处发现。
- 整改：actor provider 改为 `() => unknown`（会话返回值继续作为原始边界数据）；已知 reader/resolver/authorizer 使用函数签名；反馈 policy/time、任务 actorId、救助 filter、订单 source/perspective/ID/可见性列表和领养 transition map 使用领域类型。订单与路由读取仍保留私有 runtime parser，以便 JS/历史数据输入继续 fail-closed。
- 验收：共享 TS 消费者增加错误 provider/callback/filter/transition map 正反例；`npm run typecheck` 与 `npm run test:governance`（526/526）通过。

TS-R15 完成时的生产源码快照为 355 个 TS/Vue 文件：显式 `any` 类型节点 0；`unknown` 1956 个，其中 Vue SFC 脚本 275 个（83 个文件）。数量是语法节点，不等同于欠缺项。剩余 `unknown` 主要用于 route/eventChannel、微信事件、storage/session、异常以及 `normalize*` / `parse*` / `is*` 原始输入；这些数据会在进入领域 DTO 前被校验和收窄。带 `Record<string, unknown>` 的兼容存储行保留未知旧字段，代表开放原始记录边界，不代表页面 Props 或业务命令使用无类型输入。

### 11.8 TS-R16 — 已知展示/解析辅助函数仍接收 unknown

- 优先级 / 状态：P2 / 已完成。
- 位置：领养进度状态展示；救助证实列表与数量展示；动态媒体列表投影；公告投粮重量展示；地址识别文本；`PawImage` CSS 尺寸转换。
- 影响：这些调用方已有明确页面状态、标准 RescueRecord、组件媒体 Props、公告展示对象、字符串文本或 CSS 尺寸标量，却仍可将任意值传给公开 helper，削弱了共享 DTO 与组件 Props 的约束。
- 整改：状态展示接收明确的 status source；救助证实展示 helper 接收规范化 `RescueRecord`，证实字段的旧别名仍在 storage parser 中统一转换；动态媒体使用 `DynamicMediaInput[]`；公告重量 helper 使用 `AnnouncementRecordInput`；地址识别仅接收字符串；图片尺寸转换使用 string/number/null/undefined 联合类型。补充 `RescueProof.liked` 可选布尔字段，以保留已存在的规范化展示状态。
- 验收：TS shared consumer 增加错误状态、记录、地址、公告、图片尺寸入参的负例；storage 旧证实字段别名覆盖规范化测试；`npm run typecheck` 和相关治理测试通过。

TS-R16 完成时的生产源码快照为 355 个 TS/Vue 文件：显式 `any` 类型节点 0；`unknown` 1946 个，其中 Vue SFC 脚本 275 个（83 个文件）。数量是语法节点，不等同于欠缺项。剩余 `unknown` 主要用于 route/eventChannel、微信事件、storage/session、异常以及 `normalize*` / `parse*` / `is*` 原始输入；这些数据会在进入领域 DTO 前被校验和收窄。带 `Record<string, unknown>` 的兼容存储行保留未知旧字段，代表开放原始记录边界，不代表页面 Props 或业务命令使用无类型输入。

### 11.9 TS-R17 — 公开结构化命令仍用 unknown 输入

- 优先级 / 状态：P2 / 已完成。
- 位置：消息深链创建/解析/恢复与 auth continuation 保存；production deep-link resolver 入参；反馈业务 key/request key；社交变更只读 gate；`PawImage` source、压缩结果和显示模式辅助函数。
- 影响：这些入口的调用方已有明确的深链、continuation、反馈 identity、社交 mutation 或组件 source 形状，却仍能直接传任意值，编译器无法约束必要字段和联合类型。
- 整改：增加 `DeepLinkInput`、`AuthContinuationInput`、反馈 business/request identity discriminated union、`SocialMutationInput` 及 `PawImage` helper 参数类型。原始 deep-link 输入通过显式 `parseDeepLinkInput(unknown)` 收窄；业务 key、continuation 和 social gate 仍保留运行时严格字段检查。消息缺少可恢复 deep link 时显示 unavailable 状态并停止保存 continuation。
- 验收：TS shared consumer 增加合法与非法 deep-link、continuation、feedback identity、social intent、PawImage source/尺寸正反例；`npm run typecheck`、`npm run test:governance`（526/526）、`npm run build:mp-weixin`、包体积/资源/边界检查及 `git diff --check` 均通过。主包 1577.1 KiB，低于 2048 KiB 硬限制，高于 1536 KiB 质量建议线。

TS-R17 完成时的生产源码快照为 355 个 TS/Vue 文件：显式 `any` 类型节点 0；`unknown` 1933 个，其中 Vue SFC 脚本 275 个（83 个文件）。数量是语法节点，不等同于欠缺项。剩余 `unknown` 主要用于 route/eventChannel、微信事件、storage/session、异常以及 `normalize*` / `parse*` / `is*` 原始输入；这些数据会在进入领域 DTO 前被校验和收窄。带 `Record<string, unknown>` 的兼容存储行保留未知旧字段，代表开放原始记录边界，不代表页面 Props 或业务命令使用无类型输入。

### 11.10 TS-R18 — 页面与组件的已知局部参数仍使用 unknown

- 优先级 / 状态：P2 / 已完成。
- 位置：`components/libai-NineGridLayout/libai-NineGridLayout.vue` 的 `gridItemSrc`（网格项来自 `string[]`）；`components/AdoptPickCatsSheet.vue` 的 `normalizeAdoptionValue`（选择值只允许 string、number 或空值）。
- 影响：这两个局部 helper 的实际调用方已有稳定值类型，却仍接受任意 `unknown`，削弱了组件内数据流的静态检查。
- 整改：参数分别收紧为 `string` 和 `string | number | null | undefined`；动态路由、原生回调和存储输入仍在对应解析边界校验。
- 验收：TS shared consumer 加入无效 helper 参数负例；`npm run typecheck`、`npm run test:governance`（526/526）、`npm run build:mp-weixin` 和 `git diff --check` 通过。构建主包 1577.1 KiB，低于 2048 KiB 硬限制，高于 1536 KiB 质量建议线。

TS-R18 完成后的生产源码快照为 355 个 TS/Vue 文件：显式 `any` 类型节点 0；`unknown` 1931 个，其中 Vue SFC 脚本 273 个（81 个文件）。数量是语法节点，不等同于欠缺项。复核后保留的 `unknown` 主要用于 route/eventChannel、微信事件、storage/session、异常以及 `normalize*` / `parse*` / `is*` 原始输入；这些数据会在进入领域 DTO 前被校验和收窄。带 `Record<string, unknown>` 的兼容存储行保留未知旧字段，代表开放原始记录边界，不代表页面 Props 或业务命令使用无类型输入。

### 11.11 TS-R19 — 已知页面/组件数据仍有少量 unknown 入参

- 优先级 / 状态：P2 / 已完成。
- 位置：`PawRegionPicker.initialize`、小院创建页的 `doTrim`、选择面板 label、投喂订单页状态展示 helper、动物详情页已解析的图片 URL helper、相册/图片裁剪器的触摸点和坐标 helper，以及领养审核详情页的 reviewer helper；领养审核 mock 的 reviewer options；微信地址成功回调、selector query 结果与录音停止回调。
- 影响：这些调用点已经持有 string、选择联合类型、`PawEvent`/触摸坐标或微信回调 DTO，仍允许 `unknown` 会令已知页面/组件数据流失去编译期约束。
- 整改：按调用点收紧为 string、`SelectionValue`、string[]、`PawEventTouchPoint`、`UniNamespace.ChooseAddressRes`、`UniNamespace.NodeInfo[]` 与 `YardRecorderStopEvent`；领养审核 mock options 补齐 tab/role/ID 类型。route 参数、eventChannel detail、storage/session 及网络/异常 payload 的原始解析边界继续接收 `unknown` 并验证。
- 验收：TS shared consumer 覆盖组件初始化、页面 helper、审核列表、WeChat 地址回调和触摸事件的有效/无效调用；`npm run typecheck`、shared-contract 消费者测试、`npm run test:governance`（526/526）、`npm run build:mp-weixin` 及包体积/资源/边界检查通过。主包 1577.1 KiB，低于 2048 KiB 硬限制，高于 1536 KiB 质量建议线。

TS-R19 完成后的生产源码快照为 355 个 TS/Vue 文件：显式 `any` 类型节点 0；`unknown` 1898 个，其中 Vue SFC 脚本 246 个（79 个文件）。数量是语法节点，不等同于欠缺项。当前复核未再发现已知 Props、页面/组件局部参数、已知回调结果仍以 `unknown` 对外暴露的明确问题；剩余项主要属于 route/eventChannel、微信事件/回调、storage/session、异常以及 `normalize*` / `parse*` / `is*` 原始输入边界。带 `Record<string, unknown>` 的兼容存储行保留未知旧字段，代表开放原始记录边界，不代表页面 Props 或业务命令使用无类型输入。

### 11.12 TS-R20 — 局部业务 helper 与失败结果仍残留不必要的 unknown

- 优先级 / 状态：P2 / 已完成。
- 位置：`packages/dynamic/services/orderAssociation.ts` 的订单关联与反馈 eligibility helper 顶层参数及状态常量；`packages/feeding/services/taskReader.ts`、`packages/dynamic/services/feedbackPublisher.ts` 的已知状态常量；`feedbackPublisher.ts` 的失败结果 `data` 字段。
- 影响：订单 helper 的所有调用方都传入已判定为对象的订单记录，但 API 仍接受任意 `unknown`；固定状态字面量列表写成 `unknown[]` / `Set<unknown>`；反馈失败分支始终返回 `data: null`，消费者却只能看到 `unknown | null`。
- 整改：订单 helper 入参收紧为 `Record<string, unknown>`（字段仍保留原始类型供运行时校验）；已知状态采用字面量 tuple 并通过相等性比较原始状态；反馈失败结果的 `data` 固定为 `null`。
- 验收：TS shared consumer 正例验证记录入参与 `null` 失败数据，负例拒绝 primitive helper 入参和把失败数据当字符串；`npm run typecheck`、订单 picker、投喂任务 reader 与反馈 publisher 治理测试通过。生产源码 `any` 仍为 0；总 `unknown` AST 节点较 R19 减少 8 个，为 1890 个，Vue SFC 246 个（79 个文件）。

## 12. 2026-09-25 TS 改造复核跟进

### 12.1 本轮确认的问题与整改

| 复核项 | 处理结果 |
| --- | --- |
| 评论作者兼容 | 新增 `commentProfileIdentity`，支持当前 `author` 嵌套结构和历史上直接挂在评论记录上的 `name`、`avatar`；两种形状都有治理测试。 |
| 图片事件守卫 | `PawImageEvent` 缩为实际需要的 `{ type: string }`；守卫同时校验对象形状和字符串 `type`，拒绝空对象、错误类型和 null。 |
| 付款请求变化 | `uni.requestPayment` 分支把 provider fallback 抽为 `toYardFeedUniPaymentParams`，默认 `wxpay` 的理由是 uni API 的 provider 必填；原生 `wx.requestPayment` 参数路径不变，helper 覆盖默认及显式 provider。没有发起真实付款，因此此行为尚无真机支付链路证据。 |
| 双重断言 | 反馈证据与订单 reader 的公开 options 改为具体类型，删除 `as unknown as` 断言；持久化/异常等原始值仍在读取和归一化边界校验。 |
| 宠物名册失败结果 | API 结果改为成功/失败判别联合，名册页恢复错误响应及异常处理，失败时清空旧列表并显示失败文案。mock 当前仍只产出成功结果。 |
| JS 文件范围 | 将 44 个核心文件明确为子范围，并把本批 diff 中的 41 个 packages service、5 个 domain-read service、6 个 PawIcon 文件及 `main.ts` 补入，总计 97 个第一方运行时模块；`vite.config.ts` 单独记录为构建配置迁移。 |
| `unknown` 防回归 | 新增 `unknown-type-boundary.test.cjs` 与 `unknown-type-sites-baseline.json`：按生产文件和规范化源码行记录当前站点数量，新增站点须经审查后更新快照。该门禁防止无审查增长，但不等于已逐项证明全部既有站点合理。当前为 1886 个 unknown 类型 AST 节点、355 个生产 TS/Vue 文件；其中 246 个位于 79 个 SFC 脚本，197 个文件进入站点快照。 |
| 行尾差异 | 已清理 12 个路径中的混合 CRLF、行尾空格及多余 EOF 空行；`git diff --check HEAD` 通过。 |

### 12.2 本轮验证与仍未关闭项

- `npm run typecheck` 通过；`npm run test:governance` 通过 528/528；`npm run build:mp-weixin` 通过，主包 1577.9 KiB、总包 3418.5 KiB；包体积、资源和边界检查通过。`npm run check:native-ui` 通过（345 个源码文件，5 条历史基线项）。
- 改动相关文件 ESLint 为 0 errors、49 warnings；全仓 `npm run lint` 仍有 21 errors、501 warnings，分布于 14/113 个文件。剩余错误包含全角空格、一个空 catch block，以及既有 scripts/tests 的 unused 变量、转义和异常链规则；全仓 lint 尚未通过。
- 全仓 `npm run format:check` 仍有 541 个文件未通过；本轮新增的治理脚本、测试和站点快照单独 Prettier 检查通过。未对 500 余个文件做批量格式改写。
- `npm run dev:mp-weixin` 完成开发构建，但现有微信开发者工具项目窗口中的模拟器在刷新时无响应；控制台报告 `COMPILE_WXSS`、`WCC` 60 秒超时及后续 `__route__ is not defined` 渲染错误。本轮没有得到运行时、交互、几何或视觉验收证据，也没有打开新窗口或触发真实付款。需手动恢复现有 `unpackage/dist/dev/mp-weixin` 项目窗口后才能补验。
- 因全仓 lint、Prettier、DevTools 运行时和真实支付链路仍未通过/未验证，第 7 节的完全验收条件继续保持未关闭。
