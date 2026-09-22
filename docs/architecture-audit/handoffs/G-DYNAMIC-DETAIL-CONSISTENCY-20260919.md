# G-DYNAMIC-DETAIL-CONSISTENCY · 2026-09-19

## 目标

关闭动态详情只替换 `dynamicId`、其余仍显示演示内容的 F03 缺口；让直接详情、消息深链和 `account.tasks` 动态任务共同重读同一持久动态记录，并对记录失效保持 fail-closed。

## 交付

- `pages/dynamicDetail/services/reader.js`
  - 唯一读取 `PAWHOME_DYNAMIC_RECORDS`。
  - 校验 opaque `dynamicId`，精确匹配 `dynamicId/id`，坏 JSON、缺 key、未知记录和私密跨 actor 返回明确错误。
  - 公开动态可由详情页读取；任务/消息必须先有可信 actor；私密记录只接受作者或显式 reader。
  - 归一化正文、作者、小院、媒体、评论、投喂来源和统计字段；无 writer。
- `pages/dynamicDetail/index.vue`
  - 移除静态小院、作者、媒体和评论 mock。
  - 详情字段绑定归一化持久记录；`onShow` 重读；缺失/失效显示不可用态。
  - rank 组件仅在有持久 rank 数据时挂载，空记录不触发 `SeamlessScroll` 空值错误。
- `pages/dynamicDetail/deepLink.vue`
  - 改为调用共享 reader，不再维护第二份 storage/actor 规则。
- `pages/feature/services/messageStore.js`
  - 动态消息在记录标记为公开时允许收件人读取，随后仍由详情 deepLink 按当前 ID 重读；私密动态继续按关系拒绝。
- `tests/governance/dynamic-detail-reader.test.cjs`
  - 覆盖持久字段归一化、公开/私密 actor、缺失/坏存储/伪造 ID和源码去 fixture。
- `tests/governance/message-store.test.cjs`
  - 覆盖公开动态消息收件人进入同一当前记录。

## 运行证据

在用户手动打开的 `unpackage/dist/dev/mp-weixin` DevTools 项目中使用一次性 actor/动态/消息夹具：

- 直接详情正文/作者/小院：`.artifacts/runtime/dynamic-detail-persistent-f03.png`
- 任务入口进入详情并读取同一正文：通过 `packages/account/pages/tasks/index` 已处理动态卡断言。
- 消息入口进入详情并读取同一正文：`.artifacts/runtime/dynamic-detail-message-f03.png`
- 删除动态记录后的不可用态：`.artifacts/runtime/dynamic-detail-invalid-f03.png`
- 夹具清理后 `PAWHOME_ACTOR_SESSION`、`PAWHOME_DYNAMIC_RECORDS`、`PAWHOME_MESSAGES` 均为空；console `grep -i error` 为空。

## 验收与边界

- `npm run test:governance`：332/332 PASS。
- `npm run build:mp-weixin`：PASS（仅既有 Sass deprecation warnings）。
- `npm run check:package:final`：PASS；主包 1,572,832 bytes，目标 1,572,864 bytes，余 32 bytes；本次 final 构建全量 4,140,109 bytes。
- 真实云端动态 producer、评论/点赞 writer、反馈页面写入、微信 code→actor 映射和新 Figma 视觉/几何验收不属于本 handoff。
- 主包禁止继续新增公共依赖；reader 必须留在动态详情边界，后续共享前先做字节预算。
