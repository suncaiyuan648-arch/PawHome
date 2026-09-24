# C0 Jury Detail Route Migration Handoff

日期：2026-09-19  
范围：`pages/yard/juryDetail.vue` 旧语义页清理、领养评审详情与救助审核详情职责拆分

## 结论

`pages/yard/juryDetail.vue` 已迁移并删除。领养评审详情现在使用：

```text
/packages/adoption/pages/jury/detail/index?reviewItemId=<id>&businessType=adoption
```

救助审核详情继续使用独立职责页：

```text
/packages/rescue/pages/review/detail/index?reviewItemId=<id>&businessType=rescue
```

两条详情路由都要求显式的 `reviewItemId + businessType`。缺少任一参数、业务类型不匹配或本地读模型找不到对应记录时，页面保持空态并关闭动作，不猜测第一条评审记录，也不把 query role 当作权限。

## 已完成改动

- 迁移页面源：`pages/yard/juryDetail.vue` → `packages/adoption/pages/jury/detail/index.vue`。
- 删除旧 `pages.tson` 注册，新增 `packages/adoption/pages/jury/detail/index` 注册。
- `pages/yard/juryPanel.vue` 根据记录的 `reviewType` 分流：adoption 进入领养评审页，rescue 进入救助审核页；两个 URL 都携带显式 `businessType`。
- `packages/rescue/pages/review/detail/index.vue` 固定校验 `businessType=rescue`，保留救助审核详情与审核动作职责，不复用领养投票写入逻辑。
- `navigation/routeContracts.ts` 为 `adoption.jury.detail` 与 `rescue.review.detail` 增加业务类型枚举及必填约束。
- `navigation/legacyRoutes.ts` 兼容解析旧 `juryDetail` 链接时，根据注入的真实元数据生成带 `businessType` 的 canonical route；缺少真实元数据或域冲突时 fail-closed。
- `navigation/deeplinkContracts.ts`、`pages/feature/services/messageStore.ts`、救助详情 caller 生产带业务类型的审核深链。
- `docs/design/figma-map.yaml` 的待审核救助态、已投票领养态已分别指向 rescue/adoption canonical source，并记录 `reviewItemId` 与 `businessType`。
- `tests/governance/c0-route-cleanup.test.cjs` 增加旧源/注册删除、canonical 注册与 Figma 映射断言；路由与 deep-link 测试覆盖业务类型必填和错误域拒绝。

## 验证

已执行：

```text
npm run check:figma-map                         # 66 formal states, invalid 0
node --test tests/governance/route-contracts.test.cjs \
  tests/governance/deeplink-contracts.test.cjs \
  tests/governance/message-store.test.cjs \
  tests/governance/c0-route-cleanup.test.cjs   # 47 passed
git diff --check                                # pass
```

仓库级 `check:routes` 与完整构建仍受共享工作区其它治理批次影响时，以父任务的最新结果为准；本批注册、源文件、Figma map 和语义合同已完成对齐。未接入真实后端，所有读取与审核状态仍走现有本地/mock 适配层。

## 后续验收

- 在已打开的微信开发者工具中验证 adoption jury 的有效 ID、缺失 ID、错误 businessType 三个状态。
- 验证 rescue review 的有效救助审核项、adoption 类型误入、无权限/无记录空态。
- 补齐 Figma 对应节点的运行截图与交互验收；本 handoff 只确认 route/source/query 映射，不宣称视觉终验完成。
