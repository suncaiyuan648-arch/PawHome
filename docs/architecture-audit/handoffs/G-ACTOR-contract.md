# G-ACTOR / P0 contract 子批交接

日期：2026-09-16  
执行范围：可信 actor、对象关系、合法状态与 capability 的纯合同及反例测试  
执行人：治理 coder（actor_capability_contract）  
状态：**CONTRACT_SUB_BATCH_COMPLETE / BUSINESS_INTEGRATION_PENDING**  
总工动作：待总工串行评审并交各域接入；本 handoff 不预记 G-ACTOR 全批完成

## 交付结论

本子批只新增无业务依赖的 actor/capability 合同和纯单元测试，没有接入任何 Vue/uni 页面或 storage adapter。可信身份只能来自每次调用时注入的 session/actor provider；query 中的 `userId`、`role`、`managed`、`state`、`outcome`、`reviewerId` 以及实体 ID 不参与身份、关系、状态或能力判定。

救助评审的状态轴已按总工复核修正为策略显式选择的 `stateFields`。测试使用 `reviewStatus` 读取评审轴，并验证同时存在 `applicationStatus` 时不会与救助审核/评审状态混合。yard/animal 也不会自动合并 `state` 与 `status`；每条能力策略都必须明确自己的状态字段。

## 实施文件

- `navigation/actorCapabilities.ts`
  - 纯 ESM JavaScript；没有 Vue、uni-app、pages、packages、storage、mock 或业务页面依赖。
  - `resolveTrustedActor(provider)`：支持 provider 返回 `{ actor: { id, roles } }` 或 actor 对象本身；每次授权重新读取，空 session 返回 `null`，provider 失败、actor ID 非法、未知角色均拒绝。
  - actor ID 规范为首字符字母/数字、后续允许字母、数字、`.`、`_`、`:`、`-`，最长 128；角色枚举为 `applicant`、`owner`、`reviewer`、`cloud_parent`、`yard_owner`、`animal_manager`。
  - `CAPABILITIES` 覆盖 adoption application、reward claim、rescue review、yard management、animal edit，并分别提供私密读能力和/或写能力。
  - `normalizePolicy` 要求每条 read/write 规则显式提供 `roles`、合法 `states` 和 `stateFields/stateField`；缺策略、空角色/状态、非法状态字段均不放行。
  - `evaluateCapabilities` / `canCapability`：能力由可信 actor、策略角色、记录关系和记录状态联合计算；记录关系使用对象中的 applicant/owner/reviewer/yard owner/animal manager 字段，绝不从 query 补齐。
  - `assertCapability` / `assertPrivateRead`：用于写 adapter 和私密字段读取前的 fail-closed 断言。
  - `readPrivate` / `writeWithCapability`：支持注入 `readObject` 重新读取当前记录；拒绝或过期状态下 reader/writer 不会执行，形成可测试的零操作边界。
  - `createCapabilityEvaluator`：固定已审策略、但不缓存 actor；会话切换后下一次计算重新取 actor。

- `tests/governance/actor-capabilities.test.cjs`
  - 复制合同到临时 `type: module` 目录动态加载，避免修改仓库 package type。
  - 只使用本地冻结 fixture：A/B application、reward、rescue review、yard、animal 记录及 applicant/owner/reviewer/yard owner/animal manager provider。
  - 覆盖 provider/actor 规范化、空 actor/缺 provider/未知角色、合法 owner/reviewer/yard owner/animal manager、A 访问 B 的 application/order/rescue/yard/animal、伪造 `managed/state/role/outcome/reviewerId`、未知/缺失/冲突/非法状态、私密读与写零操作、fresh record、会话切换隔离、缺 policy/非法归属。

## 合同接入约定

域 adapter 应先从自身 storage/API 精确读取对象，再把真实记录传给 `readPrivate` 或 `writeWithCapability`；写入 adapter 仍需在执行前重新读取对象和能力。页面按钮可由 capability 控制显示，但不能替代 adapter 断言。

调用方必须注入实际会话 provider 和经产品/数据合同批准的 policy。例如救助评审 policy 可以声明 `stateFields: ['reviewStatus']`，并将救助申请的 `applicationStatus` 保持为独立状态轴；不能把 URL 的 `reviewerId`、`role` 或 `state` 直接传为可信依据。未批准的补材料、重新审批、多个云家长决策和其他新流程不由本模块放行。

## 验证

```text
node --test tests/governance/actor-capabilities.test.cjs
11 passed, 0 failed

git diff --check
PASS
```

本子批没有修改页面、路由、storage、构建配置、package scripts、package-lock、native baseline 或真实业务数据。

| 项目 | 真实状态 | 证据边界 |
|---|---|---|
| BUILD | NOT RUN | 纯合同子批未改变构建入口；接入域合入时由总工执行生产构建及包体门禁 |
| RUNTIME | NOT RUN | 没有启动或操作 DevTools；无页面接入可运行 |
| CONSOLE | NOT RUN | 无运行时页面日志 |
| INTERACTION | NOT RUN | 未执行任何页面/业务交互或写入 |
| GEOMETRY | NOT APPLICABLE | 无 UI 变更 |
| VISUAL | NOT APPLICABLE | 无 UI/Figma 变更 |

## 回滚与后续

本子批回滚单位是新增的 `navigation/actorCapabilities.ts` 与 `tests/governance/actor-capabilities.test.cjs`，以及本 handoff 文件；删除它们即可回退，不涉及数据迁移、路由注册或业务记录。各域接入应另行形成原子变更，不能把本合同与页面搬迁或未批准状态迁移捆绑。

总工串行接入时需要继续补充：真实 session provider 适配、每个域的批准 policy/状态字段、对象读取与写入 adapter、progress/reward/审核/动物/小院入口的越权反例，以及接入后的 BUILD / RUNTIME / CONSOLE / INTERACTION 证据。本子批完成不等于 G-ACTOR 全批完成，也不等于线上后端鉴权已具备。

