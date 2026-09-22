# PKG-TRIM-ADOPTION-FLOW：领养流程组件分包归属审计与实施

日期：2026-09-15  
执行范围：已有 `pages/meMore` 分包内的领养申请者流程组合归属调整  
执行人：治理 coder（Luna / xhigh）；总工程师复核：通过

## 结论

`PawAdoptionFlowFigma` 的运行时静态调用者只有 `pages/meMore/adoptionFlow.vue`。旧救助入口在该页面内只做参数校验和重定向到 `packages/rescue/pages/progress/index`，没有重新引入该组件；`pages/adoption/result.vue` 等其他调用方只生成旧路由 URL，不直接 import 组件。

本批已将组件从根 `components/` 下沉到既有 `pages/meMore/components/`，并把调用方改为 `./components/PawAdoptionFlowFigma.vue`。下沉阶段未改动模板、脚本、样式、props、事件、业务状态、路由 URL 和数据读写。

领养流程素材没有强行物理迁出根 `static/`。审计发现其中多项被主包组件、`utils/adoptionStorage.js`、领养审核/申请页面或同内容别名使用；`e81f2c...png` 还被 `pages/yard/adoptionAudit.vue` 和 `utils/adoptionStorage.js` 直接使用。把这些文件改成 `pages/meMore/static` 会造成跨包私有资源引用或复制整组高字节原图，违反现有资源归属约束。生产后处理和资源门禁已确认它们继续由主包根静态资源提供，组件分包向主包读取共享资源，边界合法。

## 依赖与边界

组件只由 `pages/meMore/adoptionFlow.vue` 注册。它依赖以下既有主包共享模块/组件：`PawPageNav`、`PawFixedActionBar`、`PawDialog`、`PawOwnerBadge`、`PawIcon`、`PawAdoptionPetsCard`、`PawAdoptionRejectReason`、`PawImage`、`PawRewardOrderSheet`，以及 `utils/navBack.js`、`utils/adoptionPetDisplay.js`、`utils/profileNav.js`、`utils/adoptionStorage.js`、`utils/applicationMockApi.js`。这些是分包向主包的依赖，`check:boundaries` 的 production/source 两侧均通过；没有新增主包→`pages/meMore` 或兄弟分包私有引用。

素材审计结果：

- `04a93...png`、`b61b026...png`：同时被领养申请/审核页面使用。
- `e435a...png`、`06034d...png`：路径只在该组件出现，但内容分别与 `pet-orange`、`apply-dog` 及首页/动物域别名相同，主包仍需保留 canonical 内容。
- `45f5fc...png`、`db5da...png`、`07acee...png`：路径只在该组件出现，但内容分别与首页/feature、profile/jury、yard-detail 素材重复，不能按组件路径误判为私有。
- `e81f2...png`：组件、`pages/yard/adoptionAudit.vue`、`utils/adoptionStorage.js` 共同使用。

没有移动或复制上述源素材，也没有修改 `prepare-mp-weixin-package.cjs`、共享资源路径或资源质量；构建产物中的组件位于 `unpackage/dist/build/mp-weixin/pages/meMore/components/`，资源仍位于主包 `static/figma/adoption-flow/`，避免了跨包路径和视觉资产变化。

## 包体证据

基线采用上一批 `PKG-TRIM` 生产构建报告（2026-09-15），本次采用同一工具链重建后的 `.artifacts/package-audit/package-size.json`：

| 指标 | 调整前 | 调整后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,864,534 bytes / 1,820.8 KiB | 1,833,986 bytes / 1,791.0 KiB | -30,548 bytes / -29.8 KiB |
| `pages/meMore` | 500,291 bytes / 488.6 KiB | 531,221 bytes / 518.8 KiB | +30,930 bytes / +30.2 KiB |
| 总包 | 3,294,377 bytes | 3,294,801 bytes | +424 bytes |

调整后组件编译产物为 `pages/meMore/components/PawAdoptionFlowFigma.{js,wxml,wxss,json}`，共 30,980 bytes；主包净减主要来自组件 JS/WXML/WXSS/JSON 不再按根组件归属计入。由于共享模块与静态素材仍由主包提供，分包增加量主要是组件自身编译产物及其分包页面引用关系。

主包仍高于最终 1.5 MiB 目标 `261,122 bytes`；本批只证明迁移期门槛和 2 MiB 硬上限，没有宣称最终门禁通过。`pages/meMore` 为 `518.8 KiB`，低于 2 MiB 硬上限。

## 验证

- `npm run build:mp-weixin`：PASS；真实生产产物生成，自动执行包体、资源和边界门禁。
- `npm run test:governance`：79/79 PASS。
- `npm run check:routes`：65/65 PASS。
- `npm run check:ui`：PASS；图标尺寸、图标用法、字体、UI 治理和 native UI 均通过。
- `npm run check:native-ui`：PASS，214 个源码文件扫描，35 项历史冻结项未增加；没有更新 `config/native-ui-legacy-baseline.json`。
- `npm run check:package`：PASS；package size、assets、boundaries 全部通过。
- `git diff --check`：PASS。

生产资源审计确认组件路径和 `usingComponents` 均落在 `pages/meMore`，所有主包共享依赖的分包访问合法；没有新增资源缺失、跨兄弟包引用或动态静态资源未解析项。

## 总工程师复验修正与运行时证据

运行时加载兼容入口后发现两个可直接消除的本页告警，已由总工程师在同一批次修正，未改变视觉或业务语义：

- 将与 `openContact` prop 同名的方法改为 `handleOpenContact`，消除 Vue 的 prop/method 重名告警。
- 将 `.af-location-copy text` 改为显式 `.af-location-copy__text`，消除微信组件 WXSS 对标签选择器的告警。

复验前清空已打开的微信开发者工具 Console，再通过 `wx.redirectTo({ url: '/pages/meMore/adoptionFlow?frame=44&id=demo-pending' })` 重新载入。页面路径显示 `pages/meMore/adoptionFlow`，模拟器正常渲染“等待院主审核中”领养申请页；新产生的仅是开发工具自动热重载和 `WAWorker reportRealtimeAction:fail not support` 两项环境告警，没有 Vue 重名、组件 WXSS 选择器告警或运行时错误。

`RUNTIME / CONSOLE / INTERACTION`：通过；`GEOMETRY / VISUAL`：页面视觉未改动，本批没有新增 Figma 像素级比对。

## 风险与回滚

主要风险是 uni-app 编译器对分包内 Vue 组件及其主包共享依赖的输出路径处理。真实生产构建已确认 `adoptionFlow.json` 使用 `./components/PawAdoptionFlowFigma`，组件产物和共享 `usingComponents` 路径均可解析，资源/边界门禁通过。

回滚单位为组件文件和单个调用方 import：把 `pages/meMore/components/PawAdoptionFlowFigma.vue` 移回 `components/PawAdoptionFlowFigma.vue`，将 `pages/meMore/adoptionFlow.vue` 的 import 恢复为 `@/components/PawAdoptionFlowFigma.vue`，然后重新执行生产构建和治理门禁。回滚不涉及 `pages.json`、路由 URL、storage、业务记录、共享组件默认值或静态素材。

本批未提交、未上传、未发布，也未进行真实领养/救助业务提交。
