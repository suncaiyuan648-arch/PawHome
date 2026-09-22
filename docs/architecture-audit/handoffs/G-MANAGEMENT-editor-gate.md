# G-MANAGEMENT editor gate

日期：2026-09-19  
范围：资料、 小院、动物编辑职责（profile / yard / animal）

## 已交付

- `packages/account/services/managementMutationAdapter.js` 提供统一编辑边界。
- 每次写动作先重新读取可信 actor 和当前记录，再由 `navigation/managementContracts.js` 计算 `profile.edit`、`yard.edit` 或 `animal.edit` 能力。
- 编辑 patch 只允许经过审计的展示字段；ID、状态、所有权、院子关系、云家长关系、管理者关系不能通过编辑器修改。
- `writer` 必须由生产域显式注入并同步返回确认；没有 writer 时返回 `WRITER_MISSING`，不会把本地表单当成成功。
- 取消编辑没有写动作；异步 writer、越权 actor、空 patch、原型键和未知字段全部 fail-closed。

## 验证

- `tests/governance/management-mutation-adapter.test.cjs`：3/3 PASS。
- 资料本人、院主、动物管理者三条能力路径均覆盖；非院主和字段越权零写入。
- 当前仓库没有 profile/yard/animal 生产 reader/writer 和对应 Figma 精确节点，故未伪造编辑页面或本地 mock 存储。页面接入必须由域 coder 注入真实 reader/writer 后再按批准节点实施。

## 保持关闭

在真实 reader/writer 和设计节点落盘前，`account.profile.edit`、`yard.manage`、`yard.edit`、`animal.editor` 的产品写入口保持关闭；管理态不能从 query、`managed` 或角色文案推导。补材料/重审仍保持关闭。

## 2026-09-19 页面 gate 收口

在不开放写能力的前提下，已把三个明确的安全态页面接入现有根：

- `packages/account/pages/profile/editor/index.vue`
- `pages/yard/editor.vue`
- `pages/yard/animalEditor.vue`

它们只调用 package-local gate，缺真实 reader 时显示 `READER_MISSING`，缺稳定 ID 时显示
`INVALID_ID`，不导入 `managementEditorRuntime`，不写 storage。`pages.json` 已注册物理页面并通过
78/78 route check；这不等于 profile/yard/animal writer 已批准，也不为三个编辑器添加任意
query 导航权限。DevTools 已验证 `pages/yard/editor?yardId=yard-a` 的关闭态截图
`.artifacts/runtime/yard-editor-closed.png`。
