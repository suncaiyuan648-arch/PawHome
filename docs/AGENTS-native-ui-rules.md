# PawHome 原生 UI 防重绘规范

本文件是根目录 `AGENTS.md` 中“原生 UI”规则的详细说明。它约束所有页面、组件和 Figma 还原任务。

## CRITICAL：微信/系统原生界面禁止由业务代码重绘

Figma 可能把设备外壳和系统界面放进画板中作为视觉参考。以下内容在 `MP-WEIXIN` 中属于参考内容，严禁由 PawHome 业务代码渲染：

- iOS/Android 状态栏
- 时间、蜂窝信号、Wi-Fi、电池
- 刘海、Dynamic Island
- iOS Home Indicator、底部系统手势条/拖动条
- 微信小程序右上角原生胶囊
- 胶囊中的省略号、圆形按钮、分隔线、边框和背景

平台责任边界：

| 内容 | 所有者 | 业务代码允许做什么 |
|---|---|---|
| 状态栏和安全区 | 操作系统/宿主 | 读取系统几何、为内容预留空间 |
| 右上角胶囊 | 微信 | 读取 `getMenuButtonBoundingClientRect()` 的几何、避让胶囊 |
| 底部 Home Indicator/系统拖动条 | 操作系统 | 使用 `env(safe-area-inset-bottom)` 处理业务底栏安全区 |

“看起来和 Figma 一样”不能成为手绘原生界面的理由。任何手绘原生 UI 都视为 UI 门禁失败。

## 顶部导航的唯一实现入口

`components/PawPageNav.vue` 与 `utils/navLayout.js` 是顶部导航几何的唯一真源。

- 页面/业务组件不得直接调用 `getMenuButtonBoundingClientRect()`。
- 页面不得再用 `statusBarHeight + N`、`top` 或 `margin-top` 单独定位作者、头像、名称、徽章等导航业务内容。
- 需要在顶部放头像/名称/身份标签时，必须放进 `PawPageNav` 的 `#content` 插槽。
- `PawPageNav` 只负责返回按钮、业务内容布局和原生胶囊避让；原生胶囊区域只能是透明占位，不能放省略号、圆环、分隔线或胶囊背景。
- `PawPageNav` 必须是 `position: fixed`，并在正常文档流中提供一个与运行时导航真实高度相等的透明 placeholder。placeholder 只补偿 fixed 脱离文档流，不得包含 `12px`、`15px`、`20px` 等页面留白。
- 页面正文间距、首个 Section 的 padding/margin 和业务区 y 坐标由页面自己决定；不得向 `PawPageNav` 增加 `bottomGap`、`designBottomGap`、`contentOffset`、`pageTopPadding` 等属性。
- `PawPageNav` 的 `#right` 插槽不用于模拟微信胶囊；新页面不得通过右侧插槽绘制任何原生操作栏元素。

顶部业务内容、返回按钮和原生胶囊的视觉中心线必须以共享导航几何为准。运行时验收目标：业务内容中心与返回按钮中心的垂直误差不超过 `1px`。

## 底部安全区与业务底栏

业务底栏可以使用 `components/layout/PawFixedActionBar.vue` 或其他已批准的底栏组件，但只能绘制业务按钮、图标和文案：

- 可以使用 `env(safe-area-inset-bottom)` / `constant(safe-area-inset-bottom)` 做安全区避让。
- 不得添加 `.home-indicator`、`.gesture-bar`、`.drag-bar` 或等价的黑色横条/圆角横条。
- 不得在固定底栏中加入“为了还原 Figma”而绘制的 `134 × 5px` 系统指示条。
- `safe-area-inset-bottom` 是布局 inset，不是绘制系统拖动条；不可把它替换成一个自绘指示器。

## 条件编译与设计稿设备壳

`#ifdef MP-WEIXIN` / `#ifndef MP-WEIXIN` 不能成为在业务页面里保留假系统 UI 的默认理由。H5 预览也不应在 `PawPageNav` 或业务组件中绘制状态栏、胶囊和 Home Indicator。

如果设计评审确实需要设备壳，必须放进独立的 Dev Preview Shell，不能进入业务页面组件，也不能进入小程序产物。

## 静态门禁和完成标准

每个 UI 任务完成前运行：

```bash
npm run check:native-ui
```

涉及顶部导航、原生安全区或底栏时，再运行：

```bash
npm run verify:ui
```

门禁失败时必须修复实现，不得删除检查、改类名绕过、增加动态详情 allowlist，或扩大 `config/native-ui-legacy-baseline.json`。baseline 只冻结历史债务；新增问题和新文件中的问题必须失败。

详细的组件 API、插槽结构和自动化验收见 [`docs/pages-design/PawPageNav.md`](pages-design/PawPageNav.md)。
