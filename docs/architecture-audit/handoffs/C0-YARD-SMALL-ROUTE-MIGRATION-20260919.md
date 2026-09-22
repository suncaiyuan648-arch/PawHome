# C0 小院/动物小批语义路由迁移交接

日期：2026-09-19
范围：小院说明、创建、品种选择、管理编辑壳、动物编辑壳、评审队列。

## 已完成

| 旧入口 | canonical 入口 | 处理 |
|---|---|---|
| `pages/yard/catGuide.vue` | `packages/yard/pages/onboarding/index.vue` | 小院职责说明与实名入口归 yard onboarding；创建按钮进入 canonical create |
| `pages/yard/createCatYard.vue` | `packages/yard/pages/create/index.vue` | 建院表单归 yard create；录音/裁剪私有组件随页下沉，地址回填使用 canonical return URL |
| `pages/yard/breedPicker.vue` | `packages/animal/pages/breed-picker/index.vue` | `kind` 兼容读取，生产 caller 改为 `species`；eventChannel 回填与补充品种状态保留 |
| `pages/yard/editor.vue` | `packages/yard/pages/editor/index.vue` | 小院资料编辑只读 gate；reader/writer 不满足时 fail-closed，不产生写入 |
| `pages/yard/animalEditor.vue` | `packages/animal/pages/editor/index.vue` | animalId + yardId 双 ID 合同；reader/writer 不满足时 fail-closed |
| `pages/yard/juryPanel.vue` | `packages/jury/pages/queue/index.vue` | 评审队列按 `businessType` 筛选；卡片组件随队列分包下沉，详情进入 adoption/rescue 专用页 |

旧注册和源码已删除，`pages/dev/*` 保持注册用于本地 QA。`yardCats` 已继续拆分为公开名册与管理名册：公开状态通过 `view=roster|status|long-list` 进入 `packages/yard/pages/animals/index`，管理状态进入要求 `yardId` 的 `packages/yard/pages/manage/animals/index`。管理页沿用已批准的 `PawPetRoster`/`PawPageNav`，添加动物、动物详情、投喂订单均保留明确入口；创建/认证的本地 mock 结果传入 `yardId=1` 后进入 canonical 管理名册。`addKitten` 与 `yardCertify` 已于 2026-09-20 分别迁入 `packages/animal/pages/editor/index` 和 `packages/yard/pages/certification/index`，表单写动作继续 fail-closed，详见 [C0-YARD-FORMS-ROUTE-MIGRATION-20260920.md](C0-YARD-FORMS-ROUTE-MIGRATION-20260920.md)。

## 路由与参数

- `yard.onboarding` → `/packages/yard/pages/onboarding/index`
- `yard.create` → `/packages/yard/pages/create/index`
- `animal.breedPicker` → `/packages/animal/pages/breed-picker/index`，推荐 `species=cat|dog`，旧 `kind` 仅用于本地兼容读取
- `yard.editor` → `/packages/yard/pages/editor/index?yardId=...`
- `animal.editor` → `/packages/animal/pages/editor/index?yardId=...&animalId=...`，新建只需 `yardId`，编辑时再传 `animalId`
- `jury.queue` → `/packages/jury/pages/queue/index?businessType=adoption|rescue`
- `yard.animals` → `/packages/yard/pages/animals/index?yardId=...&view=roster|status|long-list`
- `yard.manage.animals` → `/packages/yard/pages/manage/animals/index?yardId=...`

## 验收

```text
node --test tests/governance/c0-route-cleanup.test.cjs tests/governance/route-contracts.test.cjs
npm run check:routes
npm run check:figma-map
npm run check:ui
npm run verify:ui
npm run check:package:final
```

本批只使用本地/mock 数据与权限 gate，不接入真实后端，不执行创建小院、上传、认证、领养、救助或评审写入。
