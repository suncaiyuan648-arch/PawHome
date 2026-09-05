# PawPageNav — 微信原生导航与业务内容统一规范

## 1. 目标

解决两类长期回归：

1. Coder 把 Figma 中的 iOS/微信系统 UI 当成业务 UI 重绘；
2. 返回按钮使用一套坐标，头像/名称/身份标签再用 `statusBarHeight + N` 单独定位，导致中心线漂移。

本规范是 PawHome 顶部导航的唯一实现规则。

`PawPageNav` 永远是 `position: fixed` 的顶部导航，因此组件必须同时输出一个正常文档流中的透明 placeholder。placeholder 高度只能等于运行时 `PawPageNav` 自身的真实高度；它只补偿 fixed 脱离文档流，不承载页面留白或业务区间距。

导航组件禁止负责页面正文距离、设计留白、Content Padding、首个 Section Margin 或页面业务区 y 坐标。页面需要额外间距时，必须由页面自己的布局决定；不得向 `PawPageNav` 增加 `bottomGap`、`designBottomGap`、`contentOffset`、`pageTopPadding` 等属性。

## 2. Figma 中只能作为参考的内容

以下内容不是页面业务 UI：

```text
StatusBar / Time / Cellular Signal / Wi-Fi / Battery
Notch / Dynamic Island
WeChat top-right capsule / capsule dots / circle / divider
Home Indicator / system gesture bar / bottom drag bar
```

在 `MP-WEIXIN` 中，系统拥有状态栏和底部指示器，微信拥有右上角胶囊。业务代码只能读取几何、预留空间和避让原生控件。严禁出现：

```vue
<view class="wechat-capsule">...</view>
<view class="home-indicator" />
<view class="system-drag-bar" />
<image src="...status-bar..." />
```

H5 也不在 `PawPageNav` 中绘制系统 UI；若需要设备壳，只能放进独立的 Dev Preview Shell。

## 3. 坐标模型

微信端读取原生胶囊几何的唯一位置是 `utils/navLayout.js`：

```js
uni.getMenuButtonBoundingClientRect()
```

核心计算：

```text
statusBarHeight = system.statusBarHeight
capsuleTop       = menu.top
capsuleHeight    = menu.height
topGap           = capsuleTop - statusBarHeight
navBarHeight     = topGap * 2 + capsuleHeight
navCenterY       = capsuleTop + capsuleHeight / 2
```

因此返回按钮、头像、名称、身份徽章和原生胶囊必须共用 `navCenterY`。页面禁止自己再计算 `statusBarHeight + 25px`，也禁止用页面局部 `top`/`margin-top` 修正垂直位置。

`utils/navLayout.js` 返回的值使用 CSS px；不要再把原生 API 的 px 转成 rpx。

## 4. 正确结构

错误：

```vue
<PawPageNav />
<view class="author-row" :style="{ top: statusBarHeight + 25 + 'px' }">
  ...
</view>
```

正确：

```vue
<PawPageNav background="#fff">
  <template #content>
    <view id="qa-dynamic-detail-nav-author" class="author-row">
      <image class="author-avatar" ... />
      <text class="author-name">芝</text>
      <PawOwnerBadge />
    </view>
  </template>
</PawPageNav>
```

`author-row` 等业务导航内容不允许 `position: absolute` 或从 `statusBarHeight` 推导 `top`。垂直居中完全由 `PawPageNav` 管理。

`PawPageNav` 的右侧只保留原生胶囊透明避让区；不得通过 `#right` 插槽、图片、CSS 圆角边框或点/圆 glyph 重新实现微信胶囊。

## 5. Page API

```vue
<PawPageNav
  title="页面标题"
  background="#ffffff"
  :show-back="true"
  :auto-back="true"
  fallback-url="/pages/index/index"
/>
```

需要放置顶部业务内容时：

```vue
<PawPageNav background="#fff">
  <template #content>
    ...
  </template>
</PawPageNav>
```

允许的可选参数：

- `content-inset-left`：只调整业务内容的水平起点，必须有页面设计依据。
- `back-hit-width`：只调整返回按钮点击区域，必须有组件/交互依据。
- `title-centered`：仅当 Figma 标题要求以整屏中心线对齐时使用；不改变 placeholder 或导航几何。
- `slot-position`：带 `#content` 时的定位模式，支持 `left`（默认）、`center` 和 `custom`。
- `slot-style`：仅用于 `slot-position="custom"`，传入 slot 容器的 CSS 定位/尺寸样式；不要用它重绘原生胶囊。

事件：

```text
@back
@layout
```

`layout` 返回实际 `statusBarHeight`、`navBarHeight`、`totalHeight`、`menuTop/menuBottom`、`menuLeft/menuRight`、`menuWidth/menuHeight`、`rightReservedWidth` 和 `navCenterY`。页面可以消费整体布局安排内容，但不能据此计算第二套胶囊几何。

组件结构固定为：

```text
PawPageNav
├── fixed navigation
└── flow placeholder
    height = runtime PawPageNav height
```

例如 `statusBarHeight = 44px`、`navBarHeight = 54px` 时，导航和 placeholder 的高度均为 `98px`；页面从 `y = 98px` 继续自己的文档流布局。

## 6. 底部业务栏

底部业务栏可使用 `PawFixedActionBar`，其安全区处理应保持在业务栏内部：

```css
padding-bottom: env(safe-area-inset-bottom);
```

这只负责给按钮让出系统区域，不代表要画一个 Home Indicator。禁止在业务栏或页面底部新增黑色圆角横条、系统手势条、Home Indicator 或“底部拖动条”图片。

## 7. 自动化验收

共享导航提供稳定选择器：

```text
[data-qa="page-nav-row"]
[data-qa="page-nav-back"]
[data-qa="page-nav-content"]
```

动态详情建议业务内容使用：

```text
#qa-dynamic-detail-nav-author
```

运行时读取两个 rect：

```text
backCenterY   = back.top + back.height / 2
authorCenterY = author.top + author.height / 2
```

验收：

```text
abs(backCenterY - authorCenterY) <= 1px
```

若自动化能够取得原生 menu rect，再额外验证业务内容与 `nativeCapsuleCenterY` 的误差不超过 `1px`。

## 8. 静态门禁

必须运行：

```bash
npm run check:native-ui
```

全仓历史债务治理时使用：

```bash
npm run check:native-ui:strict
```

以下情况直接 FAIL：

```text
业务代码引用 status-bar / home-indicator / system-drag-bar 设计图
业务代码实现 Home Indicator、底部系统拖动条或手势条
业务代码实现微信 capsule、dots + circle、分隔线和胶囊背景
页面直接调用 getMenuButtonBoundingClientRect
使用 PawPageNav 的页面又通过 statusBarHeight 定位顶部业务元素
```

`config/native-ui-legacy-baseline.json` 只冻结已存在的历史问题；普通功能开发不得添加或增加 baseline allowance。

## 9. 完成条件

导航相关任务只有同时满足以下条件才能声明完成：

```text
NATIVE_UI_GUARD PASS
BUILD PASS
MP-WEIXIN runtime PASS
back / business content centerline <= 1px
无手绘 system chrome
无业务层 Home Indicator / 底部系统拖动条
```
