# PawHome Codex 调试 Prompt 模板

## 1. 动态详情 P0 修复

```text
修复 PawHome 动态详情，使其符合 docs/pages-design/动态详情.md 和
docs/pages-design/复用组件.md。

必须遵循 AGENTS.md。

本轮只处理 P0：
1. DynamicMediaViewer
2. CommentComposer
3. Comment Empty
4. Fixed BottomBar

必须：
- 先读取现有共享组件；
- 不允许通过文件末尾追加重复 selector 解决结构问题；
- 使用 npm；
- build:mp-weixin 通过；
- 使用微信开发者工具运行时验证 default 和 comments-empty；
- 检查 Console；
- 对关键节点测 runtime geometry；
- 页面滚动后 BottomBar 仍必须固定；
- 截图稳定态；
- 最多迭代 6 轮；
- 未完成 Runtime/Visual 验证不得声称“已对齐”。

最终输出：
BUILD
RUNTIME
CONSOLE
NETWORK
INTERACTION
GEOMETRY
VISUAL
以及剩余差异。
```

## 2. 只验收不改代码

```text
不要修改代码。

对 PawHome 动态详情做运行时 Figma QA。

default:
pages/dynamicDetail/index?yardId=1

empty:
pages/dynamicDetail/index?yardId=1&state=comments-empty

读取动态详情.md 和复用组件.md。

验证：
- Console
- Dynamic media rect
- Feed source rect
- Comment composer rect
- Yard summary rect
- Fixed bottom bar rect
- Primary CTA rect
- Scroll 后 fixed footer
- 两种状态 screenshot

输出：设计值 / runtime值 / diff / PASS|FAIL。
源码看起来正确不算 PASS。
```

## 3. 共享组件回归

```text
检查本次共享组件修改是否影响其他页面。

如果改了 YardSummaryCard：验证首页小院态 + 动态详情。
如果改了 PawPageNav：验证至少两个普通页面。
如果改了 PawBottomSheet：验证 ReplyComposer + Share。
如果改了 LevelCapsule：验证评论 + 排行。

使用运行时 screenshot 和 geometry，而不是只读 CSS。
```
