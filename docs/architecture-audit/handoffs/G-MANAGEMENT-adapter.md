# G-MANAGEMENT / A08 管理 adapter handoff

## 任务与范围

- taskId：`G-MANAGEMENT-adapter`
- owner：`/root/management_adapter`
- 关联合同：`navigation/managementContracts.js`、`navigation/actorCapabilities.js`
- 关联计划：`docs/architecture-audit/11-采纳建议治理增补计划.md` 的 G-MANAGEMENT/A08；`docs/architecture-audit/08-治理执行与总工验收台账.md`
- 本交付只包含读模型 binding、focused 反例测试和本 handoff；没有页面、路由、组件、Figma 节点或 storage key 变更。

## 实现

新增 `packages/account/services/managementAdapter.js`，提供：

- profile 的 public/private 读取；yard 的 public/management 读取；animal 的 public/management 读取；以及显式 `resourceType + ID` 的通用入口。
- `createManagementAdapter({ actorProvider, policy, readers })` 固定可信 actor、状态策略和域 reader，并在每次 `read` 重新解析 actor 与记录。
- 当前仓库没有 profile/yard/animal 的持久化 reader。默认不导入 `utils/yardMock.js`、`utils/petRosterMockApi.js` 或页面 fixture；缺 reader 返回 `READER_MISSING`。`readManagementResourceWithReader` 是同步 reader seam，供未来真实存储/传输绑定和测试使用。
- reader 只收到冻结的单一 ID 对象（`{ userId }`、`{ yardId }` 或 `{ animalId }`）。不会转发 query、role、managed、state、status、outcome 或调用方 record。
- 所有结果恒包含 `readOnly: true`、`canWrite: false`；没有 writer、save、setStorageSync 或其他写 API。取消 intent 在调用 reader 前结束并返回只读结果。
- 由 canonical management contract 计算 actor/关系/状态/visibility capability。云家长没有动物管理关系时不会被提权；动物管理需要当前 parent yard context 或明确 manager/child owner relation。
- 对象/locator ID 做 opaque ID、首尾空白、URL marker、demo ID、跨域前缀和跨 yard 校验；reader 返回错对象、数组、异常、Promise 或 malformed record 均 fail-closed。公开投影只保留公开字段，private/management 投影为防御性快照。

## 测试与验证

新增 `tests/governance/management-adapter.test.cjs`，focused 反例 **10/10** 通过，覆盖：

- 缺 reader 与 demo fallback；
- public projection 私密字段隔离；profile owner private read；
- yard owner relation、cloud parent/animal manager 分离；
- parent yard 与 cross-yard ID；
- cross-domain/demo/malformed ID；
- query role/managed 伪造、调用方 record 注入；
- 同步异常、异步 Promise、错对象 reader；
- cancel 零 reader；
- factory actor 切换、固定 reader 与 per-call reader 替换；
- 深冻结和恒只读 envelope。

执行结果：

```text
node --check packages/account/services/managementAdapter.js       PASS
node --test tests/governance/management-adapter.test.cjs          10/10 PASS
git diff --check                                                   PASS
```

## 未完成与边界

- 真实 profile、yard、animal storage 尚不存在，因此没有新增伪持久化 key，也没有把现有静态 yard/pet mock 宣称为真实管理数据。
- 未注册 `account.profile.edit`、`yard.manage` 或 `yard.edit` 页面；没有编辑写动作、返回列表刷新、Figma 精确节点、DevTools 运行/交互/几何/视觉证据。
- 后续域 owner 需要把安全的真实 reader 注入本 adapter，并保留每次读取 actor/记录刷新和 policy 显式注入；页面仍需单独完成设计门禁和只读→写能力评审。

## 回滚

删除本 handoff、`packages/account/services/managementAdapter.js` 与 `tests/governance/management-adapter.test.cjs` 即可回滚本子批；未发生 storage 数据变更。
