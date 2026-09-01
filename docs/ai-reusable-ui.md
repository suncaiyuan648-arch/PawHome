# PawHome 可复用 UI / 能力（供后续迭代对照）

> 由助手维护：新增通用组件或样式时，可在此补充一条，便于在其它页面快速复用。

## 通用弹窗

| 资源 | 路径 | 说明 |
|------|------|------|
| **PawNoticeModal** | `components/PawNoticeModal.vue` | 居中白底圆角卡片：灰字主文案 + 分割线 +「我知道了」。`v-model:visible`、`message`、`confirmText`（默认「我知道了」）。`z-index: 10000`。与领养入口的 `AdoptEntryHintModal` 为同一视觉规范。 |
| 文案常量 | `utils/pawNoticeMessages.js` | 见下表。 |

### pawNoticeMessages 文案一览

| 常量 | 文案 |
|------|------|
| `PAW_MSG_ADOPT_DAY_LIMIT` | 抱歉，您今日领养次数已用完 |
| `PAW_MSG_VOTE_DAY_LIMIT` | 抱歉，您今日投票次数已用完 |
| `PAW_MSG_VOICE_LEVEL` | 抱歉，您当前等级暂无语音权限 |
| `PAW_MSG_VOICE_DAY_LIMIT` | 抱歉，您今日语音次数已用完 |
| 领养入口拦截封装 | `utils/adoptEntryGate.js` | 本地 `PAW_ADOPT_ENTRY_HINT_DISMISSED`；`shouldShowAdoptEntryHint` / `dismissAdoptEntryHint`。 |
| **AdoptEntryHintModal** | `components/AdoptEntryHintModal.vue` | 对 `PawNoticeModal` 的薄封装，默认领养次数文案，兼容旧引用。 |

**接入方式示例：**

```vue
<PawNoticeModal
  v-model:visible="showX"
  :message="PAW_MSG_VOTE_DAY_LIMIT"
  @confirm="onXConfirm"
/>
```

## 组件治理基线

本轮按 `docs/pages-design/复用组件.md` 先盘点仓库现状，再收敛重复实现：

| 治理结果 | 组件 | 代码位置 | 已接入页面/组件 |
|------|------|------|------|
| REFINE / MERGE | `PawButton` / `PawPrimaryButton` | `components/base/PawButton.vue`、`components/PawPrimaryButton.vue` | 固定底栏、结果页、表单、投喂弹层 |
| NEW | `PawOverlay` / `PawDialog` / `PawBottomSheet` | `components/overlay/` | 通知、删除确认、分享、回复、选择、结果 |
| NEW | `PawFixedActionBar` / `PawSafeArea` | `components/layout/`、`components/base/` | 动态详情、小院详情、领养详情、详情底栏 |
| MERGE | `YardSummaryCard` | `components/yard/YardSummaryCard.vue` | 首页、动态详情、兼容旧 `YardInfoSummaryCard` |
| NEW | `DynamicMediaViewer` / `FeedingSourceRow` / 评论体系 | `components/dynamic/` | 动态详情、小院详情 |
| NEW | `PawTabs` / `PawSearchBar` / `PawPopoverMenu` | `components/navigation/` | 搜索页、首页、小院详情 |
| NEW | `PawActionSheet` / `PawSelectionSheet` | `components/overlay/` | 个人主页更多、添加宠物属性选择 |
| NEW | `PawFormField` / `PawOptionRow` / `PawUploadTile` / `PawAddressCard` | `components/form/` | 创建小院、设置、发布动态、地址页 |

页面接入约束：页面负责数据、跳转和 Toast；复用组件只负责展示、动效和事件。通用组件不内置演示列表或业务导航，图片默认使用 `aspectFill`，品牌色统一使用 `styles/paw-design-system.scss` 语义 Token。

## 等级胶囊（Lv）

| 资源 | 路径 |
|------|------|
| 样式 | `styles/lv-cap.scss`（`App.vue` 已 `@import`） |
| 用法 | `<LevelCapsule :level="1" />` |

只能保留 `components/LevelCapsule.vue` 一个真实视觉实现；`styles/lv-cap.scss` 仅为历史页面提供兼容样式，不应在新页面直接绘制 `.lv-cap`。

## 评论 / 动态相关

| 资源 | 路径 |
|------|------|
| 评论输入条 | `components/dynamic/CommentComposer.vue`；旧 `YardCommentComposer` 为兼容薄封装 |
| 评论流 | `components/dynamic/CommentThread.vue`、`CommentItem.vue`、`VoiceComment.vue` |
| 投粮榜条 | `components/yard/YardFeedRankStrip.vue` |
| 小院摘要卡片 | `components/yard/YardSummaryCard.vue`；旧 `YardInfoSummaryCard` 为兼容薄封装 |
| 小院宠物状态卡片 / 列表区 | `components/PawPetRoster.vue`（`variant="status"`） | 待云养 / 已云养 / 已领养 / 失踪 / 死亡分组：顶胶囊、横向头像+名、右下「n只」。列表页 `pages/yard/yardCats.vue?state=status`；小院详情 `commodityDetails` 六头像后 `>` 跳转。 |
| 详情底栏 | `components/layout/PawFixedActionBar.vue`；`DetailTabber` 保留业务事件兼容层 |

## 其它

| 资源 | 路径 |
|------|------|
| 无缝滚动榜 | `components/SeamlessScroll.vue`（`items` 等 props） |
| 个人资料跳转 | `utils/profileNav.js` → `openUserProfile` |

---

## 当前演示级弹窗挂载点（待接后端）

| 场景 | 页面/组件 | 行为说明 |
|------|-----------|----------|
| 当日无投票次数 | `pages/yard/juryDetail.vue` | 首次点击「挺真实/有点假」若 `mockVoteDayBlocked` 为 true 则弹出 `PAW_MSG_VOTE_DAY_LIMIT`，确认后关闭拦截。 |
| 无语音权限 / 语音次数用完 | `components/yard/YardCommentComposer.vue` | 麦克风：第 1 次 `PAW_MSG_VOICE_LEVEL`，第 2 次 `PAW_MSG_VOICE_DAY_LIMIT`，之后走原 toast。 |
| 领养入口提示 | `pages/index/index.vue`、`pages/dynamicDetail/index.vue` | `AdoptEntryHintModal` + `adoptEntryGate.js`。 |

接接口后：删除或改为请求结果的 `mock*` / `micStage` 等演示字段，用接口返回值驱动 `PawNoticeModal` 的 `visible` 与 `message`。
