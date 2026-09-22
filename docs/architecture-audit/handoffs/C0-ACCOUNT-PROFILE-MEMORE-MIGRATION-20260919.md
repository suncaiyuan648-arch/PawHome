# C0 ACCOUNT / meMore 语义路由迁徙交接（2026-09-19）

## 范围

本批把有明确一对一 canonical 合同的个人中心扩展页和用户页迁入 `packages/account`，并在路由、源码、caller 和设计索引完成校验后删除旧生产页面。`pages/dev/*` 未修改。

| 旧页面 | canonical 页面 | 状态 |
|---|---|---|
| `pages/meMore/browsingHistory.vue` | `packages/account/pages/history/index.vue` | 已迁移/旧页删除 |
| `pages/meMore/level.vue` | `packages/account/pages/level/index.vue` | 已迁移/旧页删除 |
| `pages/meMore/levelRules.vue` | `packages/account/pages/level/rules/index.vue` | 已迁移/旧页删除 |
| `pages/meMore/annualReport.vue` | `packages/account/pages/annual-report/index.vue` | 已迁移/旧页删除 |
| `pages/meMore/helpedAnimals.vue` | `packages/account/pages/helped-animals/index.vue` | 已迁移/旧页删除 |
| `pages/user/profile.vue` | `packages/account/pages/profile/index.vue` | 已迁移/旧页删除 |
| `pages/user/followFans.vue` | `packages/account/pages/relations/index.vue` | 已迁移/旧页删除 |

救助证实旧壳 `pages/meMore/rescueProofList.vue`、`rescueProofForm.vue` 已由既有 canonical `packages/rescue/pages/proof/{list,create}/index.vue` 承载，本批确认旧壳和注册均已移除，生产 caller 已直接使用 `rescue.proof.*`。

## 关键治理

- `pages.json` 仅注册 canonical `packages/account` 页面；旧 `pages/meMore`/`pages/user` 页面未保留兼容注册。
- `utils/profileNav.js`、个人主页关系入口、`pages/me/index.vue`、`pages/adoption/extras.vue` 已切换到语义路径。
- 等级页的年度报告、帮助动物、等级规则入口使用 `buildRoute('account.*')`。
- 个人页和关系列表移除页面自绘微信胶囊及直接读取胶囊几何，改用 `PawPageNav`；历史、帮助动物、年度报告也统一使用共享导航。
- `docs/design/figma-map.yaml` 新增 `account` 状态组，旧稿节点明确标记 `retained-legacy`，不宣称视觉终验。
- `docs/pagesmap/statistics.md`、`docs/architecture-audit/06-全量路由迁移与验收矩阵.md` 已同步 canonical 路径和旧页清理状态。
- `myCloudPets`、`myAdoption`、`myAssets`、地址页以及 yard 管理页没有在本批迁移：它们仍是多职责聚合或目标页面/参数契约尚未具备完整生产实现，继续移动会制造空壳或跨域回流。

## 验证

- `npm run check:routes`：本批 account 路由注册和源码双向检查通过；当前全仓剩余失败来自并行评审详情迁移中的 `/pages/yard/juryDetail` 未注册状态。
- `npm run check:figma-map`：本批 account 映射有效；当前全仓 2 个 invalid mapping 同样来自并行 juryDetail 清理。
- `npm run check:native-ui`：本批新 account 页面未产生新增 native UI 违规；严格扫描的既有历史违规仍来自其他旧页面。
- 未接入真实后端、未执行真实写入、支付、上传或正式发布。

## 交接结论

本批可由总工程师验收为“账户/用户 C0 语义路由迁徙完成”。需在并行 `juryDetail` 迁移收口后重新运行全仓 `check:routes`、`check:figma-map`、`check:ui`、构建和 final 包体门禁；本批页面尚未进行新的 DevTools 几何/视觉终验。
