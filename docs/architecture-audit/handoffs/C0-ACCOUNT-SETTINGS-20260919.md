# C0-ACCOUNT-SETTINGS-20260919：设置页语义路由迁移

日期：2026-09-19  
执行范围：设置页、个人中心入口、地址返回目标、账户分包注册与旧页清理  
状态：待总工程师验收；未提交、未上传、未接入真实后端

> 后续批次说明（2026-09-19）：本交接早期记录中的 route checker 阻塞项已由 C0 wrapper/feeding 批次收口；当前注册/源码检查为 71/71。设置迁移结论不变。

## 迁移结果

| 项目 | 旧路径 | 当前路径 | 结果 |
| --- | --- | --- | --- |
| 设置页源码 | `pages/meMore/settings.vue` | `packages/account/pages/settings/index.vue` | 已迁移 |
| 设置页注册 | `pages.meMore.settings` | `packages.account.pages.settings.index` | 已迁移 |
| 设置入口 | `/pages/meMore/settings` | `buildRoute('account.settings', {})` | 已迁移 |
| 地址返回目标 | `/pages/meMore/settings` | `/packages/account/pages/settings/index` | 已迁移 |
| 私有行组件 | `pages/meMore/components/form/PawOptionRow.vue` | `packages/account/pages/settings/components/form/PawOptionRow.vue` | 已迁移 |

## 行为保持

- 设置页仍使用 `PawPageNav`，退出登录仍只清除 `PAWHOME_ACTOR_SESSION`，然后回到现有本地登录页 `/packages/auth/pages/login/index`。
- 收货地址入口继续使用现存地址页；地址页默认返回新的账户设置路由。
- 个人信息、账号与安全、客服帮助、意见反馈、平台协议和关于逢猫保持原有本地提示行为。
- 没有新增真实后端、云函数、支付或业务写入依赖。

## 旧页面删除前验证

- `pages.json` 已移除 `pages/meMore/settings`，并注册 `/packages/account/pages/settings/index`。
- 源码调用方和 fallback 已扫描，旧设置路由仅保留在历史治理测试中用于验证“不支持旧路由” fail-closed 行为。
- `checkPageRoutes` 单独确认新注册项和源码项均为 `/packages/account/pages/settings/index`，旧路径不再注册或存在。
- `npm run build:mp-weixin` 通过。
- `npm run check:package:final` 通过：主包 `1,572,500 bytes`，目标 `1,572,864 bytes`，余量 `364 bytes`；全量 `4,121,775 bytes`；`packages/account` `28,966 bytes`。
- `npm run test:governance` 通过 `332/332`。
- `git diff --check` 通过。
- 已确认现有 DevTools 窗口仍指向用户手动打开的 `unpackage/dist/dev/mp-weixin`；尝试打开新路由时 `simulator_open_page`/`simulator_refresh` 均被当前 DevTools APPID/TLS 环境错误拒绝（`APPID_ERROR: Client network socket disconnected before secure TLS connection was established`），因此未把运行时截图或 Console 结果写成 PASS。

## 当前工作区的外部阻塞

完整 `npm run check:routes` 当前仍会报告其他批次遗留的未注册页面/QA 矩阵项（`adoption/pickCats`、`feedingDetail90/91/92`、`postFeedOrder`），这些不属于本批设置迁移；本批新路由注册、源码文件和旧路径清理已单独核对通过。

## 删除清单

- `pages/meMore/settings.vue`
- `pages/meMore/components/form/PawOptionRow.vue`
