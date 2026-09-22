# C0 领养审核与救助页面语义路由迁移交接

日期：2026-09-19

## 已完成

本批完成旧生产页面的语义迁移后清理：

| 旧页面 | canonical 页面 | 处理 |
|---|---|---|
| `pages/yard/adoptionAudit.vue` | `packages/adoption/pages/review/list/index.vue`、`packages/adoption/pages/review/detail/index.vue` | 列表与审核单据详情分开；旧页面和 `pages.json` 注册删除 |
| `pages/meMore/rescueProofList.vue` | `packages/rescue/pages/proof/list/index.vue` | 证实列表调用方切换 canonical；旧兼容页和注册删除 |
| `pages/meMore/rescueProofForm.vue` | `packages/rescue/pages/proof/create/index.vue` | 证实表单调用方切换 canonical；旧兼容页和注册删除 |
| 原 `packages/rescue/pages/review/index.vue` | `packages/rescue/pages/review/list/index.vue` | 明确“救助审核列表”职责并与审核详情分包路由对齐 |
| 无既有目标的“我的救助”入口 | `packages/rescue/pages/mine/index.vue` | 新增只读申请列表，使用 `rescue.mine` contract 和真实本地持久记录 |

`packages/adoption/pages/review/detail/index.vue` 保留现有本地/mock 审核动作链路，未接入真实后端；`packages/rescue/pages/mine/index.vue` 只读，不暴露写入能力。`pages/dev/*` 未改动，继续保持开发专用。

## 路由和数据边界

- `navigation/routeContracts.js` 增加 `rescue.mine` 和 `rescue.review.list`。
- `adoption.review.detail` 允许 `applicationId`、可选 `reviewItemId`、`view`、受限审核阶段和审核者上下文；审核列表不再伪造 reviewItemId，applicationId-only 由 adapter 精确解析唯一 review item。
- `services/domainReads/adoption/reviewAdapter.js` 支持 applicationId-only 的唯一解析；零条或多条匹配均 fail-closed。
- `packages/rescue/services/lists.js` 继续强制 `includeDemo:false`、可信 actor 和只读结果。
- 救助证实页面保持 `rescueId` 单据边界；旧 `type/source/sourceType/id/recordId` 兼容别名不再作为生产页注册路径。
- 领养审核页的本地写动作仍由现有 mock storage seam 承担；不表示已接入真实审核服务。

## 验证

- `node --test tests/governance/route-contracts.test.cjs tests/governance/rescue-lists-adapter.test.cjs tests/governance/adoption-review-adapter.test.cjs`：32/32 通过。
- `npm run check:ui`：通过；PawIcon、图标使用、排版、UI governance、native UI 均通过。
- `npm run build:mp-weixin`：构建通过；本批 canonical 页面位于 `packages/adoption`/`packages/rescue` 分包。
- `npm run check:assets`：通过。
- `npm run check:boundaries`：通过。
- `git diff --check`：通过。
- 注册表核对：adoption review list/detail、rescue mine/review list、rescue proof list/create 均已注册；旧 adoptionAudit/rescueProofList/rescueProofForm 源文件均已移除。
- `npm run check:figma-map`：66 个 formal states 生成成功，评审待投票/已投票节点已分别绑定 rescue/adoption canonical 详情。
- `npm run check:routes`：74 registered / 74 source，旧 adoptionAudit/rescueProof/juryDetail 路由均已删除，canonical 页面注册一致。
- `npm run check:package:final`：最终主包由总工在全部批次合入后统一复核；本批页面位于 rescue/adoption 分包，不应把评审详情依赖重新拉回主包。

## 未完成/后续

- 领养审核页面尚未完成基于可信 actor 的运行时正向夹具、交互、几何和视觉验收；本批只完成 C0 路由语义拆分与本地/mock 行为保留。
- `packages/rescue/pages/mine/index.vue` 尚无个人中心正式入口和运行时正向 actor fixture；后续接入口必须使用 `buildRoute('rescue.mine', {})`，不能把公开基金列表当作个人申请列表。
- `pages/yard/juryDetail.vue` 已迁入 `packages/adoption/pages/jury/detail/index.vue`，旧壳与 pages.json 注册已删除；rescue 入口保持指向独立的 `packages/rescue/pages/review/detail/index.vue`。详见 [C0 jury handoff](C0-JURY-ROUTE-MIGRATION-20260919.md)。
- 领养 root 页和 `pages/feature/index.vue` 的其他跨域旧职责继续按 C0 矩阵治理；`pages/meMore/adoptionFlow.vue` 已由 [C0 adoption flow handoff](C0-ADOPTION-FLOW-ROUTE-MIGRATION-20260919.md) 清理。
