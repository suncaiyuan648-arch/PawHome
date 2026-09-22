# C0 个人资产与云养宠物语义路由迁徙交接（2026-09-19）

## 迁徙范围

旧的 `pages/meMore/myAssets.vue` 是宠物名册、我的宠物、勋章地图和勋章成就的聚合页；`pages/meMore/myCloudPets.vue` 是云养关系列表。本批按业务职责拆分并删除旧生产页面/注册：

| 旧入口 | canonical 路由 | 说明 |
|---|---|---|
| `myAssets?mode=pets` | `/packages/yard/pages/animals/index` | 必须提供 `yardId`，缺失时只读阻断 |
| `myAssets?mode=pets&state=owned` | `/packages/animal/pages/mine/index` | 必须提供 `userId`，缺失时只读阻断 |
| `myCloudPets` | `/packages/animal/pages/sponsored/index` | 必须提供 `userId`，缺失时只读阻断 |
| `myAssets?mode=medals` | `/packages/account/pages/medals/index` | 勋章列表只读展示 |
| `myAssets?mode=map` | `/packages/account/pages/medals/map/index` | 勋章地图职责独立 |
| `myAssets?mode=new` / 首次勋章 | `/packages/account/pages/medals/achievement/index` | 勋章成就只读展示 |

`pages/me/index.vue` 已切换到 `buildRoute('animal.mine')`、`buildRoute('animal.sponsored')`、`buildRoute('account.medals')` 和显式小院 ID 读取；没有绑定小院时不拼接伪造 yardId。旧 `myAssets`、`myCloudPets` 文件和 `pages.json` 注册已删除。`pages/dev/*` 未修改。

## 边界与安全

- 新 animal/yard 页面只接受受限格式的显式 `userId`、`yardId`、`petId`；缺少 ID 不加载列表，也不把 query 的 role/managed/state 当作能力。
- 页面使用现有 `PawPetRoster` 只读本地展示组件；没有真实后端、写入、支付、上传或发布能力。
- 勋章页面使用 `AccountMedalView` 读-only 本地状态，勋章成就按钮只显示只读提示，不写 storage。
- `navigation/routeContracts.js` 将 `animal.mine`、`animal.sponsored` 的 `userId` 标为必填；旧 myAssets resolver 对 owned 状态要求显式 `userId`，旧路径仅保留在纯兼容解析器中，不再注册为生产页。
- `docs/design/figma-map.yaml` 增加 `account` 下动物/云养/勋章状态，节点使用既有页面映射中的精确旧稿节点并标记 `retained-legacy`，不宣称视觉终验。

## 验证结果

- `node --test tests/governance/c0-route-cleanup.test.cjs`：7/7 PASS。
- `npm run check:routes`：74 registered / 74 source，PASS。
- `npm run check:figma-map`：66 formal states，PASS。
- `npm run check:native-ui`：276 source files，PASS；19 项历史冻结违规，无本批新增项。
- `npm run check:ui-governance`：PASS。
- `npm run build:mp-weixin`：PASS。
- `npm run check:package:final`：PASS；主包 1494.5 KiB，低于 1.5 MiB 推荐线；`packages/animal` 4.5 KiB，`packages/yard` 2.4 KiB，`packages/account` 384.2 KiB；资源 743 files / 1020 refs；production/source boundaries PASS。
- `git diff --check`：PASS。

## 待后续

本批未迁移 `myAdoption`、地址聚合页及 yard 管理/编辑页：它们仍依赖各自未完成的业务 adapter、真实身份关系和更细的页面契约，继续移动会制造空壳或伪造默认 ID。运行时 DevTools 页面跳转/几何/视觉验收仍由总工程师统一安排；本批未接入真实后端。
