# C0 动态详情语义路由迁移交接

- 日期：2026-09-19
- 负责：C0 动态详情迁移 coder
- 范围：动态详情页、动态深链壳、持久 reader、生产 caller、路由契约和 Figma QA 映射
- 约束：仅本地/mock 持久存储，不接入真实后端，不执行真实业务写入

## 结论

`pages/dynamicDetail` 已完成迁移并从生产路由删除。动态详情职责归入 `packages/dynamic` 分包：

- `/packages/dynamic/pages/detail/index`
  - 详情渲染、评论空态、动态分享状态
  - `dynamicId` 是唯一定位键，`yardId` 仅作为关联信息
  - 继续通过 `PAWHOME_DYNAMIC_RECORDS` reader 读取本地记录
- `/packages/dynamic/pages/deep-link/index`
  - 消息/任务深链入口
  - 先通过同一 reader 做当前 actor/公开可见性检查，再重定向详情页
- `/packages/dynamic/services/reader.js`
  - 从旧 `pages/dynamicDetail/services/reader.js` 随业务域迁移
  - 保持非法 ID、缺失记录、坏存储、私密跨 actor 的 fail-closed 行为

已删除旧源码和旧注册：

- `pages/dynamicDetail/index.vue`
- `pages/dynamicDetail/deepLink.vue`
- `pages/dynamicDetail/services/reader.js`
- `pages.json` 中的 `pages/dynamicDetail` root

## Caller 与契约调整

以下生产 caller 已改为 canonical dynamic package 路径：

- 首页动态卡
- 发布成功页
- 投喂详情动态时间线
- 消息深链 producer/reader
- 深链壳到详情的 redirect
- 详情分享路径
- 浏览记录页通过 `buildRoute('dynamic.detail', { dynamicId })` 进入深链合同

`navigation/routeContracts.js` 的 `dynamic.detail` 目标更新为：

```text
/packages/dynamic/pages/deep-link/index
```

详情直达 UI 路径统一为：

```text
/packages/dynamic/pages/detail/index
```

旧 `/pages/dynamicDetail/*` 生产路径已无 caller、无 pages.json 注册、无旧 `.vue` 源文件。

## 设计与测试同步

- `docs/design/figma-map.yaml` 的 `dynamic_detail` 默认态、评论空态已指向 `packages/dynamic/pages/detail/index.vue`。
- `docs/pages-design/动态详情.md` 的源码入口、路由和验收引用已更新到 dynamic 分包。
- `tests/governance/dynamic-detail-reader.test.cjs` 改为从 dynamic 分包加载 reader/page/deep-link。
- `tests/governance/c0-route-cleanup.test.cjs` 增加旧动态详情路由删除和新 dynamic 分包路由注册断言。
- `docs/architecture-audit/06-全量路由迁移与验收矩阵.md` 已将 R30 标记为已清理，并补充 C0 当前覆盖行。
- `docs/architecture-audit/08-治理执行与总工验收台账.md` 的 C0 当前批次计数更新为 15 个旧生产页面，并挂载本交接文档。

## 验证

已通过：

```text
node --test tests/governance/dynamic-detail-reader.test.cjs tests/governance/c0-route-cleanup.test.cjs
8/8 PASS

node --test tests/governance/route-contracts.test.cjs tests/governance/deeplink-contracts.test.cjs tests/governance/task-page.test.cjs
37/37 PASS

npm run check:figma-map
48 formal states PASS
```

`npm run build:mp-weixin` 的 Uni 编译阶段通过，生成了 `packages/dynamic` 产物（约 22.8 KiB）。本次完整 package audit 在共享工作区被其他并行救助迁移的未完成文件阻断：

```text
[Package boundaries] missing packages/rescue/pages/review/list/index.vue:48 -> ../../services/reviewAdapter.js
```

该阻断不来自 dynamic 分包；救助迁移补齐后需由总工重新运行完整构建、`check:routes`、`check:package:final` 和 `git diff --check`。

当前 `check:routes` 还会受到并行 account 迁移中旧页面已删除而新页面尚未完成注册的暂态影响；dynamic 相关 route/source/QA 检查已同步。

## 运行边界

本批未接入真实后端、真实消息 producer、云端身份交换、评论/点赞 writer 或真实业务写入。运行时视觉验收沿用现有动态详情设计基线，最终 375px 几何和新稿视觉终验由总工批次统一执行。
