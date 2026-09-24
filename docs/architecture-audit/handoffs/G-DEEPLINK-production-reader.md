# G-DEEPLINK / A10 生产持久 reader 绑定交接

日期：2026-09-19  
范围：消息/任务深链 resolver 与现有持久业务存储的只读绑定  
状态：**PRODUCTION_READER_BINDING_COMPLETE / PAGE_EVENT_INTEGRATION_PENDING**

## 交付范围

本批新增：

- [`navigation/productionDeepLinkResolver.ts`](../../../navigation/productionDeepLinkResolver.ts)
- [`tests/governance/production-deeplink-resolver.test.cjs`](../../../tests/governance/production-deeplink-resolver.test.cjs)

`createProductionDeepLinkResolver` 固定真实持久 reader：

| businessType | reader | 记录来源 | 演示回退 |
|---|---|---|---|
| adoption | `getAdoptionById(id, { includeDemo: false })` | `PAWHOME_ADOPTIONS` | 禁止 |
| rescue | `getRescueById(id, { includeDemo: false })` | `PAWHOME_RESCUES` | 禁止 |
| feeding | `findRewardOrderById(id)` | `PAWHOME_REWARD_ORDERS` | 不存在 |
| dynamic | `PAWHOME_DYNAMIC_RECORDS`（按 `dynamicId`/`id` 精确读取） | key 缺失或记录不存在时明确 `READER_MISSING`/`NOT_FOUND` | 禁止 fixture/首条卡片回退 |

领养/投喂历史记录使用的 `id` 字段只在 resolver 输出边界投影为合同要求的
`applicationId`/`orderId`，不创建第二份记录，也不写回 storage。救助记录自身已有
`rescueId`。所有 reader 都由 `resolveDeepLink` 再经过当前记录 ID/域校验、深冻结和
`canWrite:false` 封装。

## 安全边界

- reader 只收到 `businessType`、稳定业务 ID、可选 `reviewItemId` 和可信 actor；不接收
  URL、routeName、source、legacyState、actorRole、outcome 或任意 query。
- 任务深链没有可信 actor 时，在调用 reader 前返回 `AUTH_REQUIRED`。
- dynamic 已绑定 `PAWHOME_DYNAMIC_RECORDS` 持久 reader；key 缺失、根结构异常或 ID 不存在时仍明确失败，不读取页面 fixture、不回退首条动态、不从消息标题猜业务对象。
- 默认 reader 只读，未调用 `setStorageSync`/`removeStorageSync`；补材料、重审、审核、
  付款和其他写动作没有开放。

## 反例验证

`tests/governance/production-deeplink-resolver.test.cjs` **4/4 PASS**，覆盖：

1. adoption/rescue/feeding 持久记录按精确 ID 读取，demo ID 明确 `NOT_FOUND`，没有 storage 写入；
2. feeding/dynamic 在存在持久 key 时按稳定 ID 读取，缺 key 仍 fail-closed；
3. 注入 reader 只能收到稳定 ID 与 actor；
4. task 缺少可信 actor 时不调用 reader，返回 `AUTH_REQUIRED`。

本地验证：

```text
node --check navigation/productionDeepLinkResolver.ts       # PASS
node --test tests/governance/production-deeplink-resolver.test.cjs  # 3/3 PASS
```

## 后续接入边界

消息生产者仍需在消息记录中保存 `businessType` 与对应稳定
`businessId`/`reviewItemId`，页面或 eventChannel 调用本 resolver 后再执行已注册的语义
路由；不能继续只保存展示文案或旧状态。消息列表持久化、消息生产者、eventChannel
及页面运行/视觉验收仍由后续 C6/C8 批次负责。本批没有修改 `pages.tson`、路由表或任何
业务写入行为。


## 2026-09-19 最新总工复验

动态与投粮任务 reader 已分别读取 `PAWHOME_DYNAMIC_RECORDS` / `PAWHOME_FEEDING_ORDERS`，production resolver 的 adoption/rescue/feeding/dynamic 默认 reader 均排除 demo 并按稳定 ID 重读；focused production reader **4/4**，全量治理 **318/318**。消息生产者、消息 storage、eventChannel 以及页面调用 resolver 仍是明确的 PRODUCER_PENDING，不将本批 reader binding 标记为完整消息深链。

## 2026-09-19 总工收口说明

消息生产、storage、eventChannel 和页面消费已在现有 `pages/feature`/`pages/dynamicDetail`
分包形成独立的 append-only seam，详见 [`G-DEEPLINK-message-producer.md`](./G-DEEPLINK-message-producer.md)。本 handoff 的 reader 绑定状态仍有效，但整体 G-DEEPLINK 更新为“仓库内本地生产边界完成、真实云端 event source 待接入”；不能把本地 producer 授权回调伪装成后端消息服务。

最新回归：生产 resolver **4/4**、消息 store **5/5**、全量治理 **323/323**；任务/消息页面只在当前业务记录重读成功后继续导航，缺 key、未登录或错对象均显示安全空态。
