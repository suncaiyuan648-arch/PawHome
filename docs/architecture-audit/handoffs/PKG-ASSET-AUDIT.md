# PKG-ASSET-AUDIT：搜索结果组件与主包静态资源归属

日期：2026-09-15  
执行范围：主包静态资源归属审计中的一个低风险批次  
执行人：治理 coder（Luna / xhigh）；总工程师复核：通过；未提交、未上传、未发布

## 结论

已完成一个可证明的低风险归属调整：

- `components/SearchResultTabs.vue` 移至 `pages/search/components/SearchResultTabs.vue`。
- `pages/search/index.vue` 的唯一调用方改为 `./components/SearchResultTabs.vue`。
- 下沉迁移本身没有改动组件模板、脚本、样式、props、事件、数据表达式和图片字节。迁移前后原始组件源文件 SHA-256 均为 `926c0c2a9079478794dc9e97aae6d61d4a5323f96673ed9df073cc82f07b1472`。

静态审计证明该组件只有一个生产调用方：`pages/search/index.vue`。没有其他源码页面、组件或工具 import 它；历史审计表也记录为 1 个调用方。组件原来位于根 `components/`，资源管线会按保守规则把根组件引用的搜索图片归入主包。迁移后生产资源报告将搜索专用资源归入 `pages/search`，且生产资源/边界检查无缺失或跨包私有引用。

## 资源证据

以下资源在迁移前被计入主包，迁移后只由搜索分包持有；内容 hash 未改变：

| 资源 | 迁移后 owner/destination |
|---|---|
| `figma/history/food.png` | `pages/search` → `pages/search/static/figma/history/food.png` |
| `figma/search/dynamic-left-1.png` | `pages/search` → `pages/search/static/figma/search/dynamic-left-1.png` |
| `figma/search/dynamic-right-1.png` | `pages/search` → `pages/search/static/figma/search/dynamic-right-1.png` |
| `figma/search/dynamic-right-2.png` | `pages/search` → `pages/search/static/figma/search/dynamic-right-2.png` |
| `figma/feature/a20abb5510abfe79a78f7b75beade4c52daa4c57.jpg` | `pages/feature`、`pages/meMore`、`pages/search` 各自持有副本；主包不再持有 |

`figma/search/yard-gallery-exact.png` 仍保留在主包，因为 `utils/yardMock.js` 也引用它；没有按单一页面扫描结果强行迁移。`common/assets.js` 本轮只审计未修改：生产文件为 3,525 bytes，仍包含由共享根组件使用的映射；其拆分需要单独验证消费者到分包的对应关系，未纳入本批。

## 包体证据

基线取上一批 `PKG-TRIM-ADOPTION-FLOW` 的生产报告：

| 指标 | 调整前 | 调整后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,833,986 bytes / 1791.0 KiB | 1,711,626 bytes / 1671.5 KiB | **-122,360 bytes / -119.5 KiB** |
| `pages/search` | 12,928 bytes | 135,617 bytes | +122,689 bytes |
| 总包 | 3,294,801 bytes | 3,303,570 bytes | +8,769 bytes |

总包增加来自同内容资源在 `pages/feature`、`pages/meMore`、`pages/search` 的分包副本；没有降低图片质量。主包距最终 1,572,864 bytes 目标仍差 **138,762 bytes**，因此本批不宣称最终门禁通过。

## 验证

- `npm run build:mp-weixin`：PASS；生成真实生产产物并执行包体、资源、边界门禁。
- `npm run test:governance`：79/79 PASS。
- `npm run check:routes`：65/65 PASS。
- `npm run check:ui`：PASS；包含图标、字体、UI 治理和 native UI 检查。
- `npm run check:native-ui`：PASS，214 个源码文件扫描，35 项历史冻结违规未增加。
- `npm run check:package`：PASS；package size、assets、production/source boundaries 全部通过。
- `git diff --check`：PASS。

## 总工程师复验修正与运行时证据

静态审计后，运行时搜索页暴露出下沉组件原有的五组原生标签选择器告警。总工程师将这些选择器改为等价的 class 选择器（`feed-like-text`、`yard-badge-text`、`gallery-item-image`、`gallery-item-text`、`follow-btn-text`），不改变布局、文案、事件、资源或组件 API。`check:ui`、native guard、生产构建和资源/边界门禁在修正后再次通过。

复用用户已打开的 `/Users/a1-6/Documents/ChatGPT/逢猫/unpackage/dist/dev/mp-weixin` DevTools 窗口，通过 Console `wx.redirectTo({ url: '/pages/search/index?keyword=%E7%8C%AB' })` 进入 `pages/search/index`，页面正常渲染返回入口、搜索栏和历史搜索内容；清空 Console 后没有运行时错误。当前窗口仍保留自动热重载、`wx.getSystemInfoSync` 弃用提示及两个共享组件 WXSS 历史告警（`PawOverlay`、`PawTabs`）；搜索组件自身的旧告警在热重载缓存下仍显示一次，生成的 dev WXSS 已确认不再含原生标签选择器，需下次完整冷启动窗口再做最终告警清零。

本批没有改变路由 URL、跨域数据合同、共享组件默认值或图片字节；未进行上传、发布或真实业务提交。

## 后续审计候选

1. `common/assets.js` 当前仍把若干共享组件的静态映射放在主包；需要按生成 export 的真实消费者逐项确认，不能仅按 `common/assets.js` 字面量删除。
2. `figma/search/yard-gallery-exact.png` 仍由 `utils/yardMock.js` 使用；若未来确认该工具不被主包消费者使用，再单独做工具/资源归属批次。
3. 根 `components/` 中其他仅被单一分包使用的组件可沿本批证据模式逐项审计；没有唯一调用方和动态白名单闭合证据的资源不迁移。
