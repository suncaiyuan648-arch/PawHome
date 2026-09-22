# PKG-PUBLISH-PRIVATE-COMPONENTS：发布动态分包私有组件归属审计

日期：2026-09-15  
执行人：治理 coder（Luna / xhigh）  
范围：根 `components/`、`pages/publishDynamic/**`、生产源码引用、真实微信分包产物与资源/边界报告  
状态：已通过总工程师独立验收；未提交、未上传、未发布

## 结论

本批确认 3 个组件都只有 `pages/publishDynamic` 分包内的生产调用方，且依赖方向均为分包到主包共享基础设施，已下沉到 `pages/publishDynamic/components/`：

| 原路径 | 新路径 | 生产调用方 | 归属结论 |
|---|---|---|---|
| `components/PawPetSelectSheet.vue` | `pages/publishDynamic/components/PawPetSelectSheet.vue` | `pages/publishDynamic/postFeed.vue` | 唯一由发布动态编辑器使用 |
| `components/PawOrderSelectSheet.vue` | `pages/publishDynamic/components/PawOrderSelectSheet.vue` | `pages/publishDynamic/postFeed.vue`、`pages/publishDynamic/postFeedOrder.vue` | 两个调用方都在同一 `pages/publishDynamic` 分包；选择订单页是该分包内的兼容壳，不构成跨域复用 |
| `components/PawSuccessOverlay.vue` | `pages/publishDynamic/components/PawSuccessOverlay.vue` | `pages/publishDynamic/postSuccess.vue` | 唯一由发布动态结果页使用 |

调用方只改为同分包相对 import：

- `postFeed.vue`：`PawOrderSelectSheet`、`PawPetSelectSheet`
- `postFeedOrder.vue`：`PawOrderSelectSheet`
- `postSuccess.vue`：`PawSuccessOverlay`

组件的 props、emits、template、script、style、组件 API、状态、路由和业务数据行为均未改动。

## 调用方与边界证据

生产源码检索排除 `unpackage/`、`.artifacts/`、`node_modules/` 与文档后确认：

- `PawPetSelectSheet` 只有 `pages/publishDynamic/postFeed.vue` 一个生产调用方。
- `PawOrderSelectSheet` 只有 `pages/publishDynamic/postFeed.vue` 和 `pages/publishDynamic/postFeedOrder.vue` 两个生产调用方，二者属于同一个分包。
- `PawSuccessOverlay` 只有 `pages/publishDynamic/postSuccess.vue` 一个生产调用方。
- 未发现动态组件名、`resolveComponent`、字符串路径、JSON `usingComponents` 或其他页面/兄弟分包引用。
- 3 个迁移组件只依赖主包共享组件：`PawBottomSheet`、`PawResultSheet`、`PawButton`、`PawIconButton`、`PawFeedingFeedbackTag`、`LevelBadge` 等；没有 `main → pages/publishDynamic` 或 `pages/publishDynamic →` 其他业务分包的私有依赖。
- 生产产物已经生成到 `unpackage/dist/build/mp-weixin/pages/publishDynamic/components/`，`check:package` 的 production/source boundary 均通过。

## 源码完整性

迁移前 `HEAD:components/...` 与迁移后文件 SHA-256 完全一致：

| 组件 | SHA-256 | 源码字节数 |
|---|---|---:|
| `PawPetSelectSheet.vue` | `aad5d004c681720f29fa36e3773e911b2411b5c1a646d2f6cf8fe502e9114294` | 6,092 |
| `PawOrderSelectSheet.vue` | `59a23e949bf2f5e205524d7f005324300147683f58fd0d1da291f060243a5bed` | 6,205 |
| `PawSuccessOverlay.vue` | `96115f69953b3422d1062a2959f25b689120881937c7bda3c3e2d778a9e782f9` | 2,967 |

除 3 个文件从根目录移动和 3 个页面的相对 import 变化外，没有源码行为差异。

## 资源审计

本批没有移动、复制或删除源码静态资源：

- `order-avatar.png` 继续保留在根 `static/figma/publish/`，因为 `utils/yardMock.js`（主包共享 mock 数据）和 `pages/publishDynamic/postFeed.vue` 都引用它；它不能被下沉为分包私有资源。
- `order-close.svg` 继续保留在根 `static/figma/publish/`，由发布动态组件引用，生产编译会通过 `common/assets.js` 解析为主包根静态资源；没有修改 URL 或复制一份分包资源。
- `order-selected.svg`、`order-unselected.svg` 仅由这两个发布动态选择器使用，资源管线在最终产物中将它们归属到 `pages/publishDynamic/static/figma/publish/`；源码保持原 URL 和字节，不额外复制根产物。
- 没有新增或修改图片、SVG、`common/assets.js` 源码；资源门禁 `missing=0`、`crossPackage=0`、`unknownDynamic=0`。

## 分包体积对比

基线采用已验收的上一批 `PKG-YARD-PRIVATE-COMPONENTS` 生产迁移报告；本批在同一工作树和同一工具链重新构建：

| 指标 | 迁移前 | 迁移后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,661,135 bytes / 1622.2 KiB | 1,642,957 bytes / 1604.5 KiB | **-18,178 bytes / -17.8 KiB** |
| 全量构建产物 | 3,304,286 bytes / 3226.8 KiB | 3,304,662 bytes / 3227.2 KiB | +376 bytes |
| `pages/publishDynamic` | — | 43,289 bytes / 42.3 KiB | 下沉组件及其编译产物归入发布分包 |

迁移后主包低于迁移期上限 `1,941,174 bytes` 和微信 2 MiB 硬上限，但仍高于推荐目标 `1,572,864 bytes`：

```text
1,642,957 - 1,572,864 = 70,093 bytes
```

本批不宣称最终 1.5 MiB 门禁通过。

## 明确暂缓项

| 候选 | 当前处理 | 暂缓理由 |
|---|---|---|
| `components/PawFlowResult.vue` | 保留主包 | 发布成功页与其他流程结果入口共用，不能随 `postSuccess` 单页下沉 |
| `components/overlay/PawBottomSheet.vue` | 保留主包 | 多个业务域和分包共享基础容器；3 个迁移组件均通过它向主包依赖 |
| `components/feeding/PawFeedingFeedbackTag.vue`、`components/customBadge/LevelBadge.vue` | 保留主包 | 投喂订单、我的资产、领养/小院等多个业务域共用 |
| `static/figma/publish/order-avatar.png` | 保留主包 | `utils/yardMock.js` 主包 mock 数据和发布页共同引用 |
| `static/figma/publish/order-close.svg` | 保留主包 | 编译产物由 `common/assets.js` 统一解析，避免修改组件模板/API；本批不复制资源 |

## Coder 自检结果

以下命令均在迁移后执行并通过：

- `git diff --check`
- `npm run test:governance`：79/79 PASS
- `npm run check:routes`：65/65 PASS
- `npm run check:ui`：PASS
- `npm run check:native-ui`：PASS（215 source files，35 项历史冻结项）
- `npm run check:package`：PASS（size/assets/production-source boundaries）
- `npm run build:mp-weixin`：PASS；最终生产产物已生成并重新通过 migration package gates

本批没有自动打开或操作微信开发者工具，没有执行登录、投喂、发布、支付或其他真实业务提交；运行时冒烟由总工程师按仓库规则另行决定。

## 总工程师独立验收

2026-09-15，根工作区总工程师在保留用户现有暂存区与工作区改动的前提下复核本批：

- 逐一核对三份迁移文件与 `HEAD:components/` 原文件 SHA-256，确认只发生文件归属与同分包相对 import 变化；未发现临时对照页、重复组件或跨分包反向依赖。
- 独立执行 `git diff --check`、`npm run test:governance`（79/79）、`npm run check:routes`（65/65）、`npm run check:ui`、`npm run check:native-ui`、`npm run check:package`，全部通过；随后再次执行 `npm run verify:ui`，通过。
- 独立生产构建 `npm run build:mp-weixin` 通过：主包 `1,642,957 bytes`（1604.5 KiB），全量产物 `3,304,662 bytes`（3227.2 KiB）；资源、source/production boundary 均通过。
- 显式运行 `npm run check:package:final` 仍按预期拒绝当前治理中间态（`1,642,957 > 1,572,864 bytes`），随后恢复 migration 报告；距推荐主包目标尚差 `70,093 bytes`，本批不宣称 final gate 通过。
- 复用用户手动打开的 DevTools 项目窗口，运行时进入 `/pages/publishDynamic/postFeed`，确认“发布动态”、编辑区、图片区和“选择投粮订单”入口渲染；打开订单选择层，确认三条 mock 订单显示。清空本批 Console 后 Debugger 显示 `Errors: 0, Warnings: 0`；没有选择订单、点击发表、投喂或任何真实业务提交。

验收结论：本批组件物理归属、引用边界、生产产物和发布编辑页运行冒烟均满足治理合同，允许进入后续资产减重批次；最终主包目标继续由后续批次负责。
