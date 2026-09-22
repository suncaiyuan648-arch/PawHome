# 02-组件引用审计：独立复核

复核日期：2026-09-08。仅复核 `docs/architecture-audit/02-组件引用审计.md`，未修改业务源码或其他审计文件。复核脚本只读取源码并解析 Vue template、script/import、Options API `components` 注册与相对/`@/` 路径。

## confirmed

- 源码清单数量正确：`components/**/*.vue` 107 个，`components/**/*.js/ts` 9 个，共 116 个；`pages/**/*.vue` 63 个；加上 `App.vue`、`main.js` 后，审计消费者总数为 181 个。
- `components/PawIcon/generated/icon-metrics.js`、`icon-names.js`、`icon-registry.js` 是生成的图标支撑模块；`PawIcon.tokens.js`、`PawIcon.utils.js`、类型/元数据文件及 `components/PawIcon/index.js` 也应归入 JS/TS 支撑文件，不能重复算作 Vue 组件。`components/CustomTabber/index.vue`、`components/WhtNoticeBar/index.vue` 则是实际 Vue 组件，目录 `index.vue` 已纳入 107 个组件。
- `unpackage/**` 与 `uni_modules/**` 未进入源码统计。仓库中实际存在 `uni_modules/uni-icons/components/uni-icons/uni-icons.vue`；页面和组件中的 `<uni-icons>` 属于第三方 uni_modules 组件，不应计入本地 `components` 清单。
- `PawIcon` 的 `components/PawIcon/index.js:1` 对 `PawIcon.vue` 的导入是 barrel 的内部 import-only 证据；它不是额外 Vue 组件。按原报告的口径，该证据计入 `PawIcon` 的 I/直接引用是自洽的。
- 未发现静态 `<component :is>`、`resolveComponent`、`defineAsyncComponent`、`createVNode`、`h` 组件调用，也未发现 `app.component`、`Vue.component` 或其他全局组件注册；因此 D=0、G=0 可确认。
- 直接 import 的相对路径与 `@/` 别名均能解析到本地文件；未发现遗漏的已解析本地组件引用。Options API 中的 import 与 `components` 注册、template 标签能够对应。
- `pages.json:565-568` 的 `tabBar.custom=true` 与 `custom-tab-bar/index.{js,json,wxml,wxss}` 的原生实现边界判断正确；`custom-tab-bar/index.json:3` 的 `usingComponents` 为空。`components/CustomTabber/index.vue` 是另一套 Vue 组件，确有 4 个页面入口，不能与原生 TabBar 合并计数。
- 重新核对后，静态直接未引用组件仍为 7 个：`components/PawFoodStatModal.vue`、`components/PawRichNoticeModal.vue`、`components/WhtNoticeBar/index.vue`、`components/an-notice-bar/an-notice-bar.vue`、`components/form/PawFormField.vue`、`components/yard/YardInfoSummaryCard.vue`、`components/yard/YardReviewFeed.vue`。这只证明当前审计范围内没有直接静态引用，不等同于可删除。

## corrected

- 原报告的汇总少算了 `PawFeedingDetailFigma` 的两组页面入口。按“同一文件内 import 与模板标签不重复计数”的口径，修正后的汇总是：

  | 指标 | 原报告 | 独立复核 |
  |---|---:|---:|
  | 直接引用 | 522 | **524** |
  | I（import） | 409 | **411** |
  | T（模板标签） | 521 | **523** |
  | D / G | 0 / 0 | **0 / 0** |

- `components/PawFeedingDetailFigma.vue` 应为 `直接 4（I4/T4/D0/G0）`：
  - `pages/meMore/feedingDetail.vue:2,103,108`：模板标签、import、注册；原报告把 import 位置写成了 `I102`，实际 import 在 103 行。
  - `pages/meMore/feedingDetail90.vue:1-2`：模板标签与 import/注册。
  - `pages/meMore/feedingDetail91.vue:1-2`：模板标签与 import/注册。
  - `pages/meMore/feedingDetail92.vue:2,6,9`：模板标签与 import/注册。
- 原报告的“用途”方法声明包含“文件语义”。在本次严格复核口径下，只有 template 中的子组件标签、script 中的 import/注册、props/emits/事件处理等可作为用途证据；仅凭文件名、目录名或推测性领域语义的角色标签不能确认，应降级为未证实描述。

## missing

- 原报告的 `PawFeedingDetailFigma` 引用位置表漏列 `pages/meMore/feedingDetail90.vue` 和 `pages/meMore/feedingDetail91.vue`，并连带漏算各自 1 个 import 证据和 1 个模板标签证据；上述两处已补入修正统计。
- 除上述两页及其对应的 2 个 I、2 个 T 外，逐组件 I/T/直接引用重算未发现其他数量差异；7 项静态未引用列表与原报告一致。

## unresolved

- `components/an-notice-bar/an-notice-bar.vue:39` 引用 `@/components/uni-icon/uni-icon.vue`，该本地路径无法解析；源码同时使用 `<uni-icons>`，但仓库实际对应的是被排除统计的 `uni_modules/uni-icons`。该组件自身没有直接业务引用，因此不能仅凭当前静态结果判断其预期依赖或是否为遗留实现。
- 静态扫描无法证明运行时字符串注册、外部插件自动注册、构建器/easycom 的隐式解析或未纳入范围的运行时入口不存在；因此 7 个“未引用”项只能保留为疑似未引用，不能据此执行删除。
- `manifest.json:65` 的 `mp-weixin.usingComponents=true` 是平台组件配置开关，不构成某个本地 Vue 组件的全局注册证据；自定义原生 TabBar 与 Vue `CustomTabber` 是否应长期并存属于架构决策，源码引用事实本身已确认。

