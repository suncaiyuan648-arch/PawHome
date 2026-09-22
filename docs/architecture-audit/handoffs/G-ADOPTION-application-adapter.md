# G-ADOPTION/A02 领养申请真实只读 adapter 交接

日期：2026-09-16  
交付范围：G-ADOPTION/A02 的申请进度读取 adapter 子批  
状态：adapter 已完成；页面、路由接入和真实写流程仍未完成

## 交付内容

新增 [`packages/adoption/services/applicationAdapter.js`](../../../packages/adoption/services/applicationAdapter.js)，提供：

- `readAdoptionApplication(applicationId, options)` / `readAdoptionApplicationById`：读取一个明确的领养申请。
- `readAdoptionApplicationWithResolver`：同步 resolver 迁移 seam，仅用于测试或未来替换读取传输；生产入口仍固定读取既有存储。
- `readAdoptionProgress`：给后续进度页面迁移使用的只读别名。

adapter 使用可信 `actorProvider` 重新解析 actor，并将申请条件交给 [`navigation/adoptionConditionContract.js`](../../../navigation/adoptionConditionContract.js)。状态只接受既有 [`utils/adoptionStorage.js`](../../../utils/adoptionStorage.js) 的 `ADOPTION_TRANSITIONS` 键；不创建第二套状态机，也不执行状态迁移。

生产入口只调用 `getAdoptionRecords({ includeDemo: false })`，边界固定在 `PAWHOME_ADOPTIONS`。申请 ID 必须是原样、不含首尾空白的 opaque ID；空 ID、URL、跨 rescue/feeding/order/dynamic/yard/animal 域 ID、demo ID 均 fail-closed。记录的 `id`/`recordId`/`applicationId`、申请人/院主/云家长关系别名和 `status`/`applicationStatus` 别名出现冲突时不修复、不猜测，直接拒绝。

申请人必须具有明确 `applicantId`/`applicantUserId` 关系才能读取私密快照；院主和云家长必须具有明确关系并显式指定 `perspective`，只获得公共最小快照。query、role、managed、status、outcome 等导航字段不会改变 actor、关系、状态或条件。多云家长必须传入显式 `cloudParentPolicy`（也兼容等值 `policy` 别名）；缺失、冲突或非法策略均 fail-closed。生产入口忽略调用方注入的 `reviewResolver`，因此页面不能伪造云家长审核决策；只有命名的 `WithResolver` 测试/未来传输 seam 接受同步 resolver，异步 review 条件 fail-closed。云家长视角只返回自己的 review 条目，院主视角不返回申请说明、申请人关系、媒体和私有宠物字段。

所有成功和失败结果深冻结，固定包含 `readOnly: true`、`canWrite: false`，没有 writer、transition、payment、审核或提交回调；resolver 只收到冻结的 `{ applicationId }`，Promise 和异常分别返回 `ASYNC_RESOLVER_UNSUPPORTED` / `STORAGE_READ_FAILED`。

## 验证

新增 [`tests/governance/adoption-application-adapter.test.cjs`](../../../tests/governance/adoption-application-adapter.test.cjs)，11/11 PASS，覆盖：

1. 依赖和只读边界；
2. applicant 成功读取、私密快照和深冻结；
3. 跨用户隔离以及 query/role/managed/status/outcome 不提权；
4. demo deep link 默认拒绝；
5. owner 显式视角与公共最小字段；
6. 多云家长 policy 缺失、冲突和 canonical approved condition；
7. 生产入口忽略注入 review resolver，防止伪造审核通过；
8. status/申请关系别名冲突；
9. 空白、URL、跨域 ID 在 storage 前拒绝；
10. resolver storage exception、Promise fail-closed；
11. actor 与存储快照每次重新读取、零写入。

本地检查：

```text
node --check packages/adoption/services/applicationAdapter.js          # PASS
node --test tests/governance/adoption-application-adapter.test.cjs     # 11/11 PASS
git diff --check                                                        # PASS
```

本子批未修改页面、`pages.json`、路由注册、`utils/adoptionStorage.js`、storage schema、package scripts、lockfile或任何业务写 API；未进行领养提交、审核、奖励领取、支付或真实云端操作。后续需要由总工安排进度/申请成功页接入、审核列表/详情 adapter 接入、页面返回刷新，以及 DevTools 的 BUILD/RUNTIME/CONSOLE/INTERACTION/GEOMETRY/VISUAL 证据。
