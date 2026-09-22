# G-DEEPLINK / A10 深链与登录续接合同交接

日期：2026-09-16  
范围：消息/任务深链、当前记录重读、登录后目标恢复与自营桥失败的纯合同子批  
状态：**CONTRACT_SUB_BATCH_COMPLETE / INTEGRATION_PENDING**

## 交付范围

本子批只新增：

- [`navigation/deeplinkContracts.js`](../../../navigation/deeplinkContracts.js)
- [`tests/governance/deeplink-contracts.test.cjs`](../../../tests/governance/deeplink-contracts.test.cjs)
- 本交接文档

没有修改页面、`pages.json`、storage、mock、network、任务/消息生产者、现有路由注册或真实业务写入，也没有实现实际导航和 eventChannel。

## 冻结合同

`createDeepLink`/`buildDeepLink` 只接受 `message`、`task`、`route` 三种来源，以及 `adoption`、`rescue`、`feeding`、`dynamic` 四种业务域。业务 ID 使用稳定 opaque ID；明显跨域前缀、URL/path、空值、原型键、未知字段、未知来源和未知业务域均拒绝。`reviewItemId` 只能进入 adoption/rescue 的审核目标，不能被 feeding/dynamic 深链携带。

目标由已审语义路由白名单决定：adoption 进入 `adoption.progress` 或 `adoption.jury.detail`，rescue 进入 `rescue.detail` 或 `rescue.review.detail`，feeding 进入 `feeding.order.detail`，dynamic 进入 `dynamic.detail`。不会接受任意 `routeName`、路径、scheme、路径穿越或外部 URL。审核详情路由必须同时携带 `reviewItemId` 与对应的 `businessType`（adoption/rescue）；消息/任务 envelope 仍可携带对应 `businessId`，它不会被合同从 `reviewItemId` 猜出。

旧消息的 `legacyState`、显示 `actorRole` 和 `outcome` 只作为被丢弃的历史提示，不能改变目标、当前状态或访问权。`resolveDeepLink` 通过调用方注入的同步 `resolver` 按 `businessType`、`businessId`、`reviewItemId` 和 G-ACTOR 的 `resolveTrustedActor` 结果重新读取当前记录；resolver 不会收到旧状态、route name、URL 或任意 query。返回记录必须带匹配的业务 ID/域标记，审核记录必须带匹配的 `reviewItemId`；缺失、越域、记录不存在、ID 冲突、resolver 异常或异步 resolver 均返回明确空态。可选 `authorize` 只读检查当前 actor 和当前记录，失败不暴露记录。

`restoreAfterAuth`/`resumeAfterAuth` 只恢复已验证的目标。未认证返回 `AUTH_REQUIRED`，认证成功也始终 `canSubmit: false`，合同没有提交回调，因此登录完成不会重放申请、投票或其他业务写入。注入的同步自营桥抛错、返回 `false` 或返回 Promise 时分别返回 `BRIDGE_FAILED`、`BRIDGE_REJECTED` 或 `ASYNC_BRIDGE_UNSUPPORTED`；桥成功只报告 `ready`，不执行导航。

所有返回的 target、当前记录和空态均为防御性冻结对象。合同没有 storage、mock、network、Vue、uni 或写 API 依赖，数据和 resolver 完全由调用方注入。

## 反例验证

`tests/governance/deeplink-contracts.test.cjs` 共 **14/14 PASS**，覆盖：

1. 纯模块、无导航/写入副作用与冻结目标；
2. 消息/任务来源、业务域和稳定 ID 路由白名单；
3. 旧状态/角色/outcome 不改变目标或当前状态；
4. 未知目标、scheme、路径穿越、未知 query 和 route mismatch；
5. 缺失 ID、URL、跨域 ID、审核项串域和原型键；
6. 任务/外部来源伪造与未知字段；
7. 按 stable IDs 重读当前记录，缺记录明确为空；
8. resolver 异常、异步返回、越域记录和错误业务 ID；
9. 审核深链保留显式 `reviewItemId`，不从救助单号推导；
10. task 深链缺少可信登录 actor 时不调用 resolver，伪造 actor/权限被拒；
11. 当前记录授权重新检查且拒绝时无私密记录泄露；
12. 登录续接不重放提交；
13. 自营桥失败、拒绝和异步返回有稳定错误合同；
14. 当前记录深冻结以及 malformed actor fail-closed。

本地验证：

```text
node --test tests/governance/deeplink-contracts.test.cjs  # 14/14 PASS
node --check navigation/deeplinkContracts.js                # PASS
git diff --check -- navigation/deeplinkContracts.js tests/governance/deeplink-contracts.test.cjs docs/architecture-audit/handoffs/G-DEEPLINK-contract.md  # PASS
```

## 接入边界与后续

本批不注册或调用任何新页面。C6/C0-C 接入消息和任务时，必须保存 `businessType` 与对应 `businessId`/`reviewItemId`，由真实域 resolver 重新查当前记录并检查能力；旧阶段字段不能当作当前状态，query/消息角色不能当作 actor。审核详情必须按真实 `reviewItemId` 与域 metadata 分流，不能缺 ID 时回落首条样本。

调用方若需要真实跨页桥接，必须在本合同之外提供 eventChannel/自营桥，并保留深链 envelope 的稳定 ID 与失败结果；认证成功后只能恢复目标，让用户主动继续业务动作。真实 storage、消息生产、任务分发、路由/页面接入以及 DevTools 的 RUNTIME、CONSOLE、INTERACTION、GEOMETRY、VISUAL 验收仍待后续批次。

回滚单位是上述三个新增文件；不涉及数据迁移、路由变更或业务记录。
