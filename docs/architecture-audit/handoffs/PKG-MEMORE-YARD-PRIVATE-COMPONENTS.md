# PKG-MEMORE-YARD-PRIVATE-COMPONENTS：个人中心与小院私有组件归属审计

日期：2026-09-15
执行人：治理 coder（Luna / xhigh）
范围：根 `components/`、`pages/meMore/**`、`pages/yard/**`、真实微信分包产物与包体/边界报告
状态：已通过总工程师独立验收；未提交、未暂存、未上传、未发布

## 结论

本批确认三项组件的生产引用均唯一属于一个现有分包，且没有动态或跨域生产引用，已下沉到对应分包：

| 原路径 | 新路径 | 唯一生产调用方 | SHA-256 |
|---|---|---|---|
| `components/address/PawAddressForm.vue` | `pages/meMore/components/address/PawAddressForm.vue` | `pages/meMore/addServiceAddress.vue`、`pages/meMore/addShippingAddress.vue` | `4b6040a2ac4a95d02ca751d339cc139c60c0aa0295156db32bab6abc4696a4da` |
| `components/feeding/PawFeedingOrderList.vue` | `pages/meMore/components/feeding/PawFeedingOrderList.vue` | `pages/meMore/myFeedings.vue`、`pages/meMore/yardFeedOrders.vue` | `1d57e1bcd5089a2084c20b9921890c1e5da8de7587f6365beac562125e045f61` |
| `components/form/PawImageCropper.vue` | `pages/yard/components/form/PawImageCropper.vue` | `pages/yard/createCatYard.vue` | `596d97525b3282097a2b30859281ea6a845f3e4be9f0b49faa35864c1e3cc3aa` |

组件迁移前后源码 SHA-256 与 `HEAD:components/...` 完全一致。只改了物理归属和调用方 import；props、emits、template、script、style、组件名、共享依赖、路由行为与业务 API 均未改动。

## 调用方与边界证据

生产源码精确检索（包含页面、组件、脚本、配置，排除 `unpackage/`、`.artifacts/`、`node_modules/` 与审计文档中的历史记录）确认：

- `PawAddressForm` 只在两个 `pages/meMore` 地址编辑页面注册和渲染；两个 import 已改为 `./components/address/PawAddressForm.vue`。
- `PawFeedingOrderList` 只在 `pages/meMore/myFeedings.vue` 与 `pages/meMore/yardFeedOrders.vue` 注册和渲染；两个 import 已改为 `./components/feeding/PawFeedingOrderList.vue`。
- `PawImageCropper` 只在 `pages/yard/createCatYard.vue` 注册和渲染；import 已改为 `./components/form/PawImageCropper.vue`。
- 没有第二个页面、分包、JSON `usingComponents`、字符串路径、`resolveComponent`、动态组件名或 `import()` 引用这三个组件。
- 三个迁移组件的内部依赖仍指向主包共享基础设施；没有形成 `main → pages/meMore`、`main → pages/yard` 或 sibling-private 依赖。

下列候选没有迁移：

- `PawYardDetailFigma`：保留根路径，受冻结 native baseline 与路由语义专项约束。
- `PawRewardOrderSheet`：同时服务 adoption 与 meMore，属于跨分包业务共享组件。
- `PawJuryActionBar`：同时服务 feature 与 yard，属于跨域评审动作组件。
- `PawPageNav`、`PawIcon`、`PawButton`、`PawCheckbox`、地址/位置选择器等共享基础设施：仍被多个页面或域使用，不能随本批私有组件迁移。

## 资源与 native baseline

本批未移动、复制或删除源码静态资源，没有修改 `common/assets.js`、Figma map 或 `config/native-ui-legacy-baseline.json`。组件源码中使用的根静态资源和共享依赖保持原 URL/API。

`npm run check:native-ui` 通过（215 source files，35 项历史冻结违规）；没有新增 native UI 违规，也没有触碰 `PawYardDetailFigma` 的冻结 baseline。

## 构建包体前后

基线为迁移前、同一工作树和同一构建工具链生成的 migration 构建报告；迁移后重新运行 `npm run build:mp-weixin` 并读取最终 `check:package-size` 报告。包体字节数以 `.artifacts/package-audit/package-size.json` 为准。

| 包 | 迁移前 | 迁移后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,641,702 bytes / 1,603.2 KiB | 1,600,610 bytes / 1,563.1 KiB | **-41,092 bytes / -40.1 KiB** |
| `pages/meMore` | 1,619,076 bytes / 1,581.1 KiB | 1,649,709 bytes / 1,611.0 KiB | +30,633 bytes / +29.9 KiB |
| `pages/yard` | 305,077 bytes / 297.9 KiB | 316,118 bytes / 308.7 KiB | +11,041 bytes / +10.8 KiB |
| 全量构建产物 | 4,386,691 bytes / 4,283.9 KiB | 4,387,273 bytes / 4,284.4 KiB | +582 bytes / +0.5 KiB |

迁移后主包仍低于 2 MiB 硬上限和 migration 门槛；主包与 `pages/meMore` 仍高于 1.5 MiB 质量推荐，本批不宣称最终包体目标完成。

## 验证结果

本批已执行并通过：

- `git diff --check`
- `npm run test:governance`：79/79 PASS
- `npm run check:routes`：65/65 PASS
- `npm run check:ui`：PASS
- `npm run check:native-ui`：PASS（215 source files，35 项历史冻结违规）
- `npm run check:package`：PASS（size/assets/production-source boundaries 全部 PASS）
- `npm run build:mp-weixin`：PASS；最终产物包含 `pages/meMore/components/{address,feeding}` 与 `pages/yard/components/form` 下沉组件

治理 coder 未自动打开微信开发者工具；运行时验证由总工程师在用户已手动打开的窗口中独立完成，几何与视觉仅按路由级冒烟记录。

## 7. 总工程师独立验收

- [x] 复核三个组件迁移前后 SHA-256 与 `HEAD` 一致；根工作区独立计算结果分别为 `4b6040a2ac4a95d02ca751d339cc139c60c0aa0295156db32bab6abc4696a4da`、`1d57e1bcd5089a2084c20b9921890c1e5da8de7587f6365beac562125e045f61`、`596d97525b3282097a2b30859281ea6a845f3e4be9f0b49faa35864c1e3cc3aa`，与 `HEAD` 内容一致。
- [x] 总工独立复跑 `git diff --check`、`npm run test:governance`（79/79）、`npm run check:routes`（65/65）、`npm run check:ui`、`npm run check:native-ui`（215 source files、35 项历史冻结违规）、`npm run check:package`、`npm run verify:ui`，全部通过。
- [x] 总工独立复跑 `npm run build:mp-weixin`，构建通过；迁移报告主包 `1,600,610 bytes / 1,563.1 KiB`、全量 `4,387,273 bytes / 4,284.4 KiB`，`pages/meMore` 为 `1,649,709 bytes`、`pages/yard` 为 `316,118 bytes`。主包距 1.5 MiB 最终目标还差 `27,746 bytes`。
- [x] 显式执行 `npm run check:package:final`，按预期因 `1,600,610 > 1,572,864` 失败；随后重新执行 `npm run check:package` 恢复 migration 报告，未把迁移期 PASS 误报为最终目标 PASS。
- [x] 在用户已手动打开的微信开发者工具 dev 窗口中只读验证三个路由：`/pages/meMore/addShippingAddress` 显示添加收货地址表单；`/pages/meMore/myFeedings?userPawId=demo-user` 显示“我的投粮”与空态；`/pages/yard/createCatYard` 显示建院表单、定位与联系人信息。每个路由加载后清空 Console，调试器均显示 `Errors: 0`、`Warnings: 0`；未保存地址、未执行投粮提交、未上传图片、未创建小院、未执行发布或生产写入。交互/几何/视觉仅完成路由级渲染冒烟，未宣称 Figma 像素验收。
- [x] 复核 `git diff` 与引用边界，没有误触碰 `pages/meMore/static/adoption-flow`、根共享资产、`PawYardDetailFigma`、`PawRewardOrderSheet`、`PawJuryActionBar`；未修改路由、组件 API、native legacy baseline、Figma map 或生产资源管线。

## 交付边界

没有修改：

- `pages.json`、路由 URL、状态机、storage key 或业务数据行为
- 三个组件的 props、emits、template、script、style、组件 API
- 共享组件默认值、Figma map、native legacy baseline、根共享资产与 `pages/meMore/static/adoption-flow`
- 上传、发布、真实地址提交、真实投粮提交或其他生产性业务写入
