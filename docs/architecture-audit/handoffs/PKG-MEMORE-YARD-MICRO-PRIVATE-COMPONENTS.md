# PKG-MEMORE-YARD-MICRO-PRIVATE-COMPONENTS：个人中心与小院微型私有组件迁移

日期：2026-09-15  
执行人：治理 coder  适用范围：`pages/meMore/**`、`pages/yard/**`、根 `components/` 及生产分包产物  
状态：已通过总工程师独立验收；未提交、未暂存、未上传、未发布

> 当前状态补充（2026-09-19）：投喂详情及其 `PawFeedingDetailFigma`/`PawToast` 私有组件已继续下沉至 `packages/feeding`，旧 `pages/meMore/feedingDetail*` 生产页已删除；详见 [C0 feeding detail route migration](C0-FEEDING-DETAIL-ROUTE-MIGRATION-20260919.md)。本文保留此前 meMore 阶段的审计证据。

## 结论

本批 7 个候选均通过生产引用与分包边界审计，确认各自只属于一个既有分包，已完成路径迁移。迁移文件源码未改动，SHA-256 与对应 `HEAD:components/...` 内容一致；仅改变物理路径和调用方的同包相对 import。

| 原路径 | 新路径 | 生产引用证据 | SHA-256 |
| --- | --- | --- | --- |
| `components/address/PawAddressImportSheet.vue` | `pages/meMore/components/address/PawAddressImportSheet.vue` | `pages/meMore/components/address/PawAddressForm.vue:81,90,96` | `9c71bd29f95d06b9f6e1a790ddfd5c4786996cb7be00811221ab410bbf4bcd9b` |
| `components/address/PawRegionPicker.vue` | `pages/meMore/components/address/PawRegionPicker.vue` | `pages/meMore/regionSelector.vue:2,7,12` | `f45014031a9cb5083510b5be2051962af8b784d2f33e344d33dbf967df9b8192` |
| `components/form/PawAddressCard.vue` | `pages/meMore/components/form/PawAddressCard.vue` | `pages/meMore/shippingAddress.vue:9,36,54` | `b7754a057d93a9532ca8ada9f8bd3836e35ab4ab9434c20b9a45ae96292b3e08` |
| `components/form/PawOptionRow.vue` | `pages/meMore/components/form/PawOptionRow.vue` | `pages/meMore/settings.vue:7-19,31,35` | `105992711eaa9a4f69187282e498f6da617f7f25dbbfc14288d85061e1b24624` |
| `components/feedback/PawToast.vue` | `pages/meMore/components/feedback/PawToast.vue` | `pages/meMore/feedingDetail.vue:92,105,108`; `pages/meMore/components/PawFeedingDetailFigma.vue:5,152,162` | `8182f74f723c61c9d31c83ea37f328e8d298553047a7256e6c957ce4cf60c2ba` |
| `components/overlay/PawSelectionSheet.vue` | `pages/yard/components/overlay/PawSelectionSheet.vue` | `pages/yard/addKitten.vue:107,152,166`; `pages/yard/yardCats.vue:112,151,156` | `f24616c2938c1a5112f0fcf3223286290447f565bdf17b4ddc8013f81a87e9c5` |
| `components/voice/PawVoiceRecorderSheet.vue` | `pages/yard/components/voice/PawVoiceRecorderSheet.vue` | `pages/yard/createCatYard.vue:107,123,135` | `37f19a3a307a0d1bb73db0da7bf423285a277cafd5de517811301bde5b23028f` |

## 引用与边界证据

精确扫描生产源码（排除 `node_modules/`、`unpackage/`、`.artifacts/`、`.git/` 和审计文档）得到以下结论：

- 7 个组件均无第二个分包调用方；没有源代码 `usingComponents`、`resolveComponent`、`defineAsyncComponent`、动态组件名或动态 `import()` 引用指向旧路径。
- `PawAddressImportSheet` 只由同一 `pages/meMore/components/address/` 下的 `PawAddressForm` 调用，调用方已改为 `./PawAddressImportSheet.vue`。
- 其余 `meMore` 候选的页面调用方已改为 `./components/...`，`PawFeedingDetailFigma` 对 `PawToast` 已改为 `./feedback/PawToast.vue`。
- 两个 `yard` 候选的页面调用方已改为 `./components/...`；编译产物的 `usingComponents` 和模块依赖均保持在 `pages/yard` 内。
- 迁移组件依赖的 `PawPageNav`、`PawIcon`、`PawButton`、`PawCheckbox`、`PawChevron`、`PawBottomSheet`、`utils/regionMock.js`、`utils/navLayout.js` 均是根主包共享基础设施；分包到主包方向在边界规则中合法，没有形成主包到分包或 sibling-private 依赖。
- `PawRegionPicker` 的 `fallbackUrl` 仍为 `/pages/meMore/shippingAddress`，路由语义未变；本批未修改 `pages.json`、导航合同或 Figma map。

## Asset 审计

没有移动、复制、删除或改写根静态资源。`PawAddressCard` 继续使用既有 `/static/figma/address/location.svg`；`PawVoiceRecorderSheet` 继续使用既有 voice 资源 URL。`npm run check:assets` 通过，未发现跨包静态资源引用、未知 asset 或动态 asset；根共享资源由现有 `common/assets.js` 维持，未扩大本批范围。

## 未迁移候选与边界

- `components/address/PawAddressPickerCard.vue`：adoption 仍共享，按任务要求保留在根 `components/`。
- `components/base/PawSafeArea.vue`、`components/overlay/PawBottomSheet.vue`、`components/location/PawLocationPickerSheet.vue`：跨多个页面/分包使用的共享基础设施，不能私有化。
- `components/PawPageNav.vue`、`components/PawIcon/PawIcon.vue`、`components/base/PawButton.vue`、`components/base/PawCheckbox.vue`、`components/base/PawChevron.vue`：跨域共享基础设施，保留根路径。
- 本批没有发现需要因跨域引用、共享 asset 歧义或 route 语义风险而停止的候选；未擅自扩大到其他候选组件。

## 代码和静态检查

迁移后执行结果：

- `npm run build:mp-weixin`：PASS；7 个组件均出现在对应分包产物下。
- `npm run check:package`：PASS（包体、asset、生产/源码边界全部 PASS）。
- `npm run test:governance`：79/79 PASS。
- `npm run check:routes`：65/65 PASS。
- `npm run check:native-ui`：PASS（215 个源码文件，35 项历史冻结违规）。
- `npm run check:ui-governance`：PASS。
- `npm run check:typography`：PASS。
- `npm run check:icon-usage`：PASS。
- `git diff --check`：PASS。

## 预期包体

以下为本次迁移后同一构建产物的观测值，供总工程师独立复核；不将本表视为最终包体目标验收：

| 包 | bytes | KiB |
| --- | ---: | ---: |
| 主包 | 1,567,713 | 1,531.0 |
| `pages/meMore` | 1,671,155 | 1,632.0 |
| `pages/yard` | 327,923 | 320.2 |
| 全量产物 | 4,387,627 | 4,284.8 |

相对上一批 handoff 的构建观测值，主包减少 32,897 bytes，`pages/meMore` 增加 21,446 bytes，`pages/yard` 增加 11,805 bytes，全量增加 354 bytes；新增分包代码归属符合预期。`pages/meMore` 仍超过 1.5 MiB 质量建议，但低于 2 MiB 单包硬上限；主包 1.5 MiB 最终包体门禁已通过。

## 交付边界

没有修改路由、页面注册、组件 props/emits/template/script/style、共享组件默认值、Figma map、native legacy baseline、根静态资源、生产资源管线或任何真实业务写入。总工程师需独立复跑 hash、引用扫描、构建和静态门禁后再确认 PASS。

## 总工程师独立复核（静态）

- [x] 逐项复核 7 个迁移文件的 SHA-256 与 `HEAD` 对应源文件一致；旧根路径已删除，调用方均为同包相对引用。
- [x] 独立通过 `git diff --check`、`npm run test:governance`（79/79）、`npm run check:routes`（65/65）、`npm run check:ui`、`npm run check:native-ui`、`npm run build:mp-weixin`、`npm run verify:ui`。
- [x] 独立通过 `npm run check:package:final`：主包 `1,567,713 bytes / 1,531.0 KiB`，低于 `1,572,864 bytes` 的 1.5 MiB 目标与 `2,097,152 bytes` 硬上限；全量 `4,387,627 bytes / 4,284.8 KiB`。`pages/meMore` 为 `1,671,155 bytes`、`pages/yard` 为 `327,923 bytes`，均低于分包硬上限但 meMore 仍高于 1.5 MiB 质量建议。
- [x] 在用户已手动打开的微信开发者工具窗口中复验 `pages/meMore/shippingAddress`、`addShippingAddress`、`regionSelector`、`settings`、`feedingDetail`、`pages/yard/yardCats`、`addKitten`、`createCatYard`：各路由均完成加载并呈现本批涉及的表单、列表或录音/选择入口；清空 Console 后调试器均显示 `Errors: 0`、`Warnings: 0`。清空前仅观察到开发热重载、`wx.getSystemInfoSync` 弃用、组件 WXSS 选择器限制、canvas 2d 建议及 `reportRealtimeAction` 环境告警，没有新增业务异常；未点击保存、上传、审核、领养、投喂或创建小院等真实写入操作。运行证据详见 `.artifacts/architecture-governance/supervision/PKG-MEMORE-YARD-MICRO-PRIVATE-COMPONENTS-runtime.md`。
- [x] 本批运行时结论仅为路由级渲染与 Console 冒烟；未作 Figma 像素级几何/视觉验收，后续仍需按设计矩阵执行完整 UI 验收。
