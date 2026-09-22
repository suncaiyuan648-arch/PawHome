# G-DEEPLINK / 消息生产、持久化与页面消费交接

日期：2026-09-19  
状态：**LOCAL_PRODUCTION_SEAM_COMPLETE / BACKEND_EVENT_SOURCE_PENDING**

## 已交付

- [`pages/feature/services/messageStore.js`](../../../pages/feature/services/messageStore.js) 提供 append-only 消息记录、严格字段校验、`messageId/eventKey` 幂等、当前 actor 隔离和当前业务记录重读。
- `appendMessage` 必须接收显式 `authorize`，未注入 producer 授权返回 `WRITER_MISSING`；没有删除、已读状态、替换或业务写入 API。
- `resolveMessageDestination` 只返回稳定 `businessType + businessId/reviewItemId` 目标，adoption/rescue/feeding/dynamic 分别绑定现有持久 key；缺记录、坏存储、越权和动态 reader 缺失均为空态。
- `emitMessageDeepLink` 只向 eventChannel 发出 `canWrite:false` 的只读 envelope。
- [`pages/feature/notificationList.vue`](../../../pages/feature/notificationList.vue) 通过当前账号列出消息并在打开前再次解析目标；[`pages/message/index.vue`](../../../pages/message/index.vue) 的六类消息行统一进入该列表，未登录或没有持久记录时由列表显示安全空态。
- [`pages/dynamicDetail/deepLink.vue`](../../../pages/dynamicDetail/deepLink.vue) 只在 `PAWHOME_DYNAMIC_RECORDS` 有当前 actor 可读记录时进入动态详情，其他情况显示不可用态。

## 约束

消息 service 放在现有 `pages/feature` 分包，避免新增顶层 package 把主包推过 1.5MiB；它不导入根导航模块，路由目标由本地白名单生成。后端推送/云函数尚未存在，因此本批交付的是仓库内可运行的生产边界和 producer seam，不能声称已有真实后端事件源。

## 验证

- `node --test tests/governance/message-store.test.cjs`：**4/4 PASS**。
- `node --test tests/governance/production-deeplink-resolver.test.cjs`：**4/4 PASS**。
- 全量 `npm run test:governance`：**323/323 PASS**。
- runtime 已打开 `/pages/feature/notificationList?category=order`，未登录态显示“登录后查看消息”；`grep -i error` 为空，截图见 `.artifacts/runtime/notification-empty.png`。
- 从 `/pages/message/index` 点击首条消息后，页栈进入 `/pages/feature/notificationList?category=interaction`，截图见 `.artifacts/runtime/message-to-notification.png`，Console error grep 为空。

## 未开放

真实云端 producer、消息已读/删除策略、支付/审核/反馈提交和补材料/重审均未从此边界开启。后续若接入云端事件，必须只调用 `appendMessage`，并继续由当前记录重读决定页面是否可达。
