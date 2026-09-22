# PKG-YARD-PRIVATE-COMPONENTS：小院页面私有组件归属审计

日期：2026-09-15  
执行人：治理 coder（Luna / xhigh）  
范围：根 `components/`、`pages/yard/**`、真实微信分包产物与包体/边界报告  
状态：已通过总工程师独立验收；未提交、未上传、未发布

## 结论

本批确认两个组件都只有一个小院生产调用方，且没有动态或跨域生产引用，已下沉到 `pages/yard/components/`：

| 原路径 | 新路径 | 唯一生产调用方 | 迁移理由 |
|---|---|---|---|
| `components/PawRescueReviewPage.vue` | `pages/yard/components/PawRescueReviewPage.vue` | `pages/yard/rescueReview.vue` | 仅救助评审路由包装器使用；组件承载救助基金统计和救助记录列表，不被其他页面/分包复用 |
| `components/PawJuryItemCard.vue` | `pages/yard/components/PawJuryItemCard.vue` | `pages/yard/juryPanel.vue` | 仅小院评审队列使用；评审卡片和投票比例展示没有其他生产调用方 |

调用方仅改为同分包相对 import：

- `pages/yard/rescueReview.vue`：`@/components/PawRescueReviewPage.vue` → `./components/PawRescueReviewPage.vue`
- `pages/yard/juryPanel.vue`：`@/components/PawJuryItemCard.vue` → `./components/PawJuryItemCard.vue`

组件源码内容、props、events、template、script、style、组件名、状态、路由行为和业务 API 均未改动。

## 调用方与隐藏引用证据

生产源码检索排除 `unpackage/`、`.artifacts/`、`node_modules/`、文档后确认：

- `PawRescueReviewPage` 只在 `pages/yard/rescueReview.vue` 注册和渲染。
- `PawJuryItemCard` 只在 `pages/yard/juryPanel.vue` 注册和渲染。
- 没有第二个页面模板、JSON `usingComponents`、字符串路径、`resolveComponent`、动态 `import()` 或其他分包调用。
- `PawRescueReviewPage` 内部只引用主包共享的 `PawPageNav`、`PawStatusPill`、`PawAvatar`、`LevelBadge`、`utils/rescueStorage.js` 与 `utils/profileNav.js`。
- `PawJuryItemCard` 内部只引用主包共享的 `PawAvatar`、`LevelBadge`、`PawStatusPill`、`PawVoteRatioBar` 和 `utils/safeImgSrc.js`。
- 迁移后依赖方向为 `pages/yard → main`；没有 `main → pages/yard`、`pages/yard → pages/adoption` 或其他 sibling-private 依赖。

生产源码中仍存在的 `components/PawJuryActionBar.vue`、`components/PawJuryVoteDialog.vue`、`components/PawVoteRatioBar.vue` 等评审相关组件没有被误判为本批私有：它们由其他页面/功能入口使用，继续保留主包共享归属。

## 资源边界

本批没有移动、复制或删除源码静态资源：

- `PawRescueReviewPage` 的 `/static/figma/feature/rescue-fund-info.svg`、`rescue-fund-bg.svg` 仍使用根 `static/` 源文件。
- `PawJuryItemCard` 的证据图 `/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png` 同时被 `utils/juryMock.js` 使用，继续保留主包根静态资源。
- 构建后 `rescue-fund-bg.svg` 被编译器按页面 CSS 依赖生成在 `pages/yard/static/`；模板绝对路径的 `rescue-fund-info.svg` 和评审证据图仍由主包静态资源提供，这是现有资源归属规则的正常产物，不是源码资源迁移。
- 未修改 `common/assets.js`、资源内容、资源 URL 或 Figma 资产。

生成产物确认存在：

```text
unpackage/dist/build/mp-weixin/pages/yard/components/PawRescueReviewPage.{js,json,wxml,wxss}
unpackage/dist/build/mp-weixin/pages/yard/components/PawJuryItemCard.{js,json,wxml,wxss}
```

`npm run check:package` 的资源与边界报告均通过，未发现 missing、unknown、cross-package 或 unresolved dynamic 资源。

## 源码完整性

迁移前（`HEAD:components/...`）与迁移后源码 SHA-256 完全一致：

| 组件 | SHA-256 | 源码字节数 |
|---|---|---:|
| `PawRescueReviewPage.vue` | `14658b610538194340b19a40974cb8e36db0646f4708fc172a9e7aa7d58baa4a` | 10,168 |
| `PawJuryItemCard.vue` | `186f55849c7a5bb8134559bcfa45afb57cded40b9ae4ae0080dc275eb59486ad` | 12,269 |

## 分包体积对比

基线为本批迁移前、同一工作树和同一构建工具链生成的 migration 报告；迁移后重新构建并生成最终产物：

| 包 | 迁移前 | 迁移后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,684,687 bytes / 1645.2 KiB | 1,661,135 bytes / 1622.2 KiB | **-23,552 bytes / -23.0 KiB** |
| `pages/yard` | 281,247 bytes / 274.7 KiB | 305,107 bytes / 298.0 KiB | +23,860 bytes / +23.3 KiB |
| 全量构建产物 | 3,303,978 bytes / 3226.5 KiB | 3,304,286 bytes / 3226.8 KiB | +308 bytes |

迁移后主包低于 2 MiB 硬上限和迁移期门槛，但仍高于推荐的 1.5 MiB（1,572,864 bytes）：

```text
1,661,135 - 1,572,864 = 88,271 bytes
```

本批不宣称最终 `npm run check:package:final` 门禁通过。

## 暂缓候选

| 候选 | 当前调用方/归属 | 暂缓原因 |
|---|---|---|
| `components/PawJuryActionBar.vue` | `pages/yard/juryDetail.vue`、`pages/feature/index.vue` 等 | 评审详情和 feature 旧入口跨域使用；下沉到 `pages/yard` 会造成 `pages/feature → pages/yard` 私有依赖 |
| `components/PawJuryVoteDialog.vue` | `pages/yard/juryDetail.vue`、`pages/feature/index.vue` 等 | 投票弹窗跨小院与 feature 入口共享，需先拆旧 feature 入口职责 |
| `components/PawVoteRatioBar.vue` | `PawJuryActionBar`、`PawJuryVoteDialog`、`pages/me/index.vue`、小院评审详情 | 评审表现层已跨域共享，不能随单一队列卡片迁移 |
| `components/PawYardDetailFigma.vue` | 商品详情与小院域 | 仍承担跨入口的小院详情组合，需独立拆分页面职责后再治理 |
| `components/auth/PawRealNamePrompt.vue` | 认证与小院建院链路 | 认证和小院跨域共用，保持主包共享避免反向私有依赖 |

## 验证结果

本批已执行并通过：

- `git diff --check`
- `npm run test:governance`：79/79 PASS
- `npm run check:routes`：65/65 PASS
- `npm run check:ui`：PASS
- `npm run check:native-ui`：PASS（215 source files，35 项历史冻结违规）
- `npm run build:mp-weixin`：PASS
- `npm run check:package`：PASS（size/assets/production-source boundaries）

总工程师已在用户手动打开的 `/unpackage/dist/dev/mp-weixin` 开发者工具窗口中独立完成运行时冒烟：

- `wx.redirectTo({url:'/pages/yard/rescueReview'})` 正常渲染“救助评审”、基金池统计、待投票/待打款/打款成功/投票否决标签和救助记录卡；清空 Console 后调试器为 `Errors: 0`、`Warnings: 0`。
- `wx.redirectTo({url:'/pages/yard/juryPanel?type=rescue'})` 正常渲染“救助评审”、待投票/投票结束计数和评审卡片；清空 Console 后调试器为 `Errors: 0`、`Warnings: 0`。
- 清空前只见既有共享 `PawBadge` WXSS 选择器提示、`PawVoteRatioBar` 的历史 computed/prop 告警、开发工具环境提示及热重载提示；没有本批迁移导致的运行时错误。未点击投票、审核、打款或其他真实业务操作，未做几何、视觉或 Figma 像素验收。

本批没有自动打开 DevTools；所有运行时验证均复用用户手动打开的窗口。

## 7. 总工程师独立验收

- 两个组件迁移前后源码 SHA-256 与 `HEAD:components/...` 完全一致；生产差异只有两个页面的同分包相对 import，未改变 props、events、template、script、style、状态或路由。
- 独立复跑 `git diff --check`、`npm run test:governance`（79/79）、`npm run check:routes`（65/65）、`npm run check:ui`、`npm run check:native-ui`、`npm run check:package`、`npm run build:mp-weixin` 与 `npm run verify:ui`，均通过；native guard 为 215 source files、35 项历史冻结违规。
- 显式执行 `npm run check:package:final` 按预期失败（`1,661,135 > 1,572,864`），随后恢复 migration 报告；当前主包 `1,661,135 bytes / 1622.2 KiB`，总包 `3,304,286 bytes / 3226.8 KiB`，距离推荐 1.5 MiB 仍差 `88,271 bytes`。本批不宣称最终包体目标完成。
- 运行时只做页面渲染和 Console 清空检查，没有执行投票、审核、打款、登录或其他真实业务提交。

## 交付边界

没有修改：

- `pages.json`、路由 URL、页面状态、storage key 或业务数据行为
- 两个组件的 props、events、template、script、style、组件 API
- 主包共享组件默认值、Figma map、native legacy baseline
- 源码静态资源、上传、发布或真实救助/领养/投票提交
