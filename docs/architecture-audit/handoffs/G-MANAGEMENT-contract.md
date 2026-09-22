# G-MANAGEMENT / A08 管理能力与只读合同交接

日期：2026-09-16  
交付范围：W3a 前置纯合同子批  
关联：G-ACTOR；A08；R05、R27、R28、R29、R46、R52–R56

## 交付范围

新增 [`navigation/managementContracts.js`](../../../navigation/managementContracts.js)。合同只依赖现有 [`navigation/actorCapabilities.js`](../../../navigation/actorCapabilities.js) 的 `resolveTrustedActor` 与 `ACTOR_ROLES`，没有 Vue、uni-app、页面、路由、storage、mock、网络或写入 adapter 依赖，也没有修改 actor contract 的公共语义。

`evaluateManagementCapabilities`（别名 `readManagementCapabilities`、`resolveManagementAccess`、`getManagementCapabilities`）接收调用方已读取的 `profile`、`yard`、`animal`，以及每次重新读取的 `actorProvider` 和显式状态 policy，返回冻结的 public read、private/management read、edit 能力与拒绝原因。`canManagementCapability`、`assertManagementCapability` 和 `createManagementEvaluator` 只查询或断言能力；本模块没有 writer/save/mutation API。

## 冻结的身份与对象边界

- actor 只来自可信 `actorProvider`；空会话、提供器异常、非法 actor 或未知 actor role fail-closed。`userId`、`yardId`、`animalId` 只定位已读取对象，必须分别与 `profile.userId`、`yard.yardId`、`animal.animalId` 匹配。
- `animal.yardId` 是动物与小院的硬关联。调用方同时提供 `yard` 时必须同一个 `yardId`；跨院或冲突 locator 直接失败，不回退其他对象。
- 本人 profile 通过 `actor.id === profile.userId` 获得 private read/edit；他人 profile 只可在公开状态和公开可见性下 read，不能 edit。profile edit 与小院/动物角色无关。
- `yard_owner` 通过明确的 `yardOwnerId`/列表关系管理小院；`owner` 只有在 policy 明确包含 `ownerRoles` 且对象的 `ownerId` 关系匹配时才可管理。两者不是由 query 或名称自动互换的角色。
- 小院编辑能力只给通过 policy 且与院主关系匹配的 actor；普通用户、`animal_manager`、`cloud_parent` 无小院 edit 能力。
- 动物 management/edit 需要显式的 `animalManagerId(s)` 关系和 `animal_manager` policy，或由同一 `yardId` 的可信 `yard_owner` 关系证明。`cloud_parent`/`cloudParentId(s)` 只作为云养关系字段，绝不自动变成 `animal_manager`；`owner` 也不自动获得动物管理能力。
- `query.managed`、`query.role`、`query.state` 只允许作为受控导航提示并完全不参与授权；其他 query 字段、对象状态缺失/冲突/不在注入 policy 的 legal state 中均 fail-closed。状态 policy 只定义允许边界，没有新增状态机或状态迁移。
- 关系别名按同一语义组做集合一致性校验：`ownerId(s)`/`ownerUserId(s)`、`yardOwner*`、`manager*`、`cloudParent*` 的多个字段必须描述同一组 ID；别名值冲突直接 fail-closed，不能静默 union。对象、locator、query 中的 ID 若带首尾空白也视为非法，避免把两个记录别名为同一对象。

## 失败与不可变语义

缺 policy、缺对象、对象 ID/关系/状态/可见性非法、跨院关系、unknown query/policy field、actor 切换和 locator 冲突都会返回全冻结的拒绝结果（或由 `assertManagementCapability` 抛出稳定合同错误）。`intent: 'cancel'`/`cancelled: true` 返回全拒绝的取消结果；合同从不调用写入函数，因此取消、失败和拒绝均为零写入。所有 capability 结果统一带 `readOnly: true`、`canWrite: false`；断言返回值也带这两个标记。结果的 actor、records、capabilities、reasons、permissions、error 及嵌套对象都深冻结。

## 测试与复验

[`tests/governance/management-contract.test.cjs`](../../../tests/governance/management-contract.test.cjs) 共 13 项通过，覆盖纯依赖、本人/他人资料读写边界、院主与普通用户、owner/yard_owner、cloud_parent/animal_manager、跨院 ID、伪造 managed/role/state、unknown query、关系别名冲突、首尾空白 ID、状态冲突/未知状态、缺 policy、取消零写入、深冻结、actor session 切换和非法 actor。

```text
node --test tests/governance/management-contract.test.cjs  # 13/13 PASS
node --check navigation/managementContracts.js              # PASS
git diff --check -- navigation/managementContracts.js tests/governance/management-contract.test.cjs docs/architecture-audit/handoffs/G-MANAGEMENT-contract.md  # PASS
```

## 接入边界与未决项

本子批未接入 `packages/account`、`packages/yard`、`packages/animal` 或任何现有 adapter、页面、路由、storage/mock/network；未注册 `account.profile.edit`、`yard.manage`、`yard.edit` 等提案路由，未修改 `pages.json`、`package.json`、lockfile、UI 或 native 规则。未提供设计节点或 Figma live 验证：资料 editor 与管理/编辑页仍受 11 号计划的精确节点/批准组件组合门禁；小院四态节点与动物 detail/editor 节点只作为后续 UI 批次的设计来源，本合同没有宣称视觉验收。

后续 C3/C4/C6 adapter 必须从可信会话与当前对象重读后调用合同，分别映射 `userId`、`yardId`、`animalId` 和实际关系字段，再在自己的写入边界执行二次能力检查。取消、失败、返回列表刷新和真实 UI/运行时证据属于后续 adapter/UI/QA 批次；本合同不决定状态迁移、产品编辑字段或任何设计布局。
