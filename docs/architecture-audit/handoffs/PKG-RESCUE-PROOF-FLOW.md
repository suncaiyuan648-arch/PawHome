# PKG-RESCUE-PROOF-FLOW：救助基金、公开详情与证实职责拆分

日期：2026-09-15
执行范围：`packages/rescue/**`；未提交、未暂存、未上传、未发布
状态：已通过总工程师独立验收；未提交、未暂存、未上传、未发布

## 交付结论

本批新增了救助基金列表、公开救助详情、证实列表和证实表单。页面边界按救助实体和操作权限固定，均通过 `navigation/routeContracts.ts` 的既有目标合同校验参数。coder 只负责 `packages/rescue/**`；总工随后完成了 `pages.tson` 注册、旧 proof 入口兼容壳和跨域调用方的串行集成，未改根共享组件的业务职责。

新增文件：

- `packages/rescue/pages/fund/index.vue`
- `packages/rescue/pages/detail/index.vue`
- `packages/rescue/pages/proof/list/index.vue`
- `packages/rescue/pages/proof/create/index.vue`
- `packages/rescue/components/RescueFundList.vue`
- `packages/rescue/components/RescueDetailView.vue`
- `packages/rescue/components/RescueProofList.vue`
- `packages/rescue/components/RescueProofForm.vue`
- `packages/rescue/services/proof.ts`
- `packages/rescue/tests/proof-flow.test.cjs`

## 行为和数据合同

`RescueFundList` 只读取 `getRescueRecords()` 和 `getRescueReviewSummary()`，展示基金统计、状态筛选和公开救助申请卡片。卡片点击使用真实 `rescueId` 构造 `rescue.detail`；没有平台审批、投票提交或打款动作。

`RescueDetailPage`、`RescueProofListPage`、`RescueProofCreatePage` 在页面边界只接受 `rescueId`。缺失、非法、未知参数和找不到记录分别进入明确空态，页面不会从列表或演示数据猜一条记录。公开详情可以进入同一 `rescueId` 的证实列表或证实表单；评审入口只有在记录带有受信任的 `reviewerAuthorized === true` 和 `reviewItemId` 时才显示，申请人/记录所有者身份不会自动获得评审权。

`services/proof.ts` 复用 `utils/rescueStorage.ts` 的 `getRescueById`、`hasRescueProofByUser` 和 `addRescueProof`，没有新增 storage key，也没有导入领养证实 API。表单保存姓名、关系、说明和身份证后四位，身份证原文不写入本地记录；当前用户对同一救助记录已有证实时返回幂等成功并不重复写入。成功后返回证实列表，列表 `onShow` 重新读取同一 `rescueId`。

包内组件只依赖根共享层（`PawPageNav`、`PawButton`、`PawFixedActionBar`、`PawCheckbox`、`PawImage`、`PawAvatar`、`PawIcon`、`LevelBadge`、`PawStatusPill`）和根救助存储/导航工具；没有从 `pages/*`、其他业务分包或旧 Adoption proof 组件静态引入，也没有重绘原生胶囊、状态栏或 Home Indicator。

实现参考设计索引中的精确节点：救助基金 `62:34421`、公开详情 `62:33657`、证实列表 `62:35393`、证实表单 `62:37451`。仓库当前 map 仍记录旧来源路径，live Figma 未在本执行环境打开；本批依照 map 节点和现有本地组件/样式桥接实现，未猜测额外节点或写入临时 Figma URL。

## 总工串行路由注册

总工已在现有 `subPackages` 的 `root: "packages/rescue"` 项中，把下面四个页面追加到已有 `pages/progress/index` 后。样式沿用救助进度页的 `navigationStyle: "custom"` 和 `backgroundColor: "#F5F5F5"`：

```json5
{
  "path": "pages/fund/index",
  "style": { "navigationStyle": "custom", "backgroundColor": "#F5F5F5" }
},
{
  "path": "pages/detail/index",
  "style": { "navigationStyle": "custom", "backgroundColor": "#F5F5F5" }
},
{
  "path": "pages/proof/list/index",
  "style": { "navigationStyle": "custom", "backgroundColor": "#F5F5F5" }
},
{
  "path": "pages/proof/create/index",
  "style": { "navigationStyle": "custom", "backgroundColor": "#F5F5F5" }
}
```

目标 route name/path/参数如下：

| route name | path | 参数 |
| --- | --- | --- |
| `rescue.fund` | `/packages/rescue/pages/fund/index` | 无 query |
| `rescue.detail` | `/packages/rescue/pages/detail/index` | 必填 `rescueId` |
| `rescue.proof.list` | `/packages/rescue/pages/proof/list/index` | 必填 `rescueId` |
| `rescue.proof.create` | `/packages/rescue/pages/proof/create/index` | 必填 `rescueId` |

当前目标合同已经存在于 `navigation/routeContracts.ts`；注册后再把 active registry 注入实际导航壳。不要为这四页增加 `source`、`sourceType`、`id`、`recordId`、`mode`、`frame` 或 `variant`。

`navigation/legacyRoutes.ts` 已覆盖 `/pages/meMore/rescueProofList` 和 `/pages/meMore/rescueProofForm`：先要求 `source`/`sourceType`/`type` 同值为 `rescue`，再校验 `rescueId`/`id`/`recordId` 别名一致并构造 `rescue.proof.*` 目标。未知参数、非 rescue 域、缺 ID 和别名冲突均失败；旧页面本身保持轻量壳，不静态导入新包组件，也不把 `role` 或 `source` 当作能力授权。

## 旧入口和调用方切换清单

| 旧入口/调用方 | 目标 | 总工处理要求 |
| --- | --- | --- |
| `/pages/yard/rescueReview`、`pages/me/index.vue` 中的救助基金入口 | `rescue.fund` | 保留旧轻量兼容壳；壳只负责跳目标列表，不能静态引入 `RescueFundList` 或详情页。 |
| `pages/yard/components/PawRescueReviewPage.vue` 的卡片详情 | `rescue.detail({ rescueId })` | 迁移后卡片 ID 必须原样传递；无 ID 失败并留在基金列表。 |
| `pages/feature/index.vue` 的 `mode=rescue-detail` 分支 | `rescue.detail({ rescueId })` | `mode=rescue-detail` 仅由旧壳解析；`rescueId` 缺失、未知记录或与 `id` 冲突时显示不可恢复状态，禁止回首条 demo。 |
| `pages/feature/index.vue` 的证实列表按钮 | `rescue.proof.list({ rescueId })` | 旧页可保留兼容跳转，但新调用不得传 `source`/`sourceType`/`id`。 |
| `pages/feature/index.vue` 的“我也来证实”按钮 | `rescue.proof.create({ rescueId })` | 先确认记录存在，再按同一 `rescueId` 打开表单。 |
| `/pages/meMore/rescueProofList`、`pages/meMore/rescueProofList.vue` | `rescue.proof.list` | 旧壳兼容 `source=rescue` 与旧 `id`/`recordId` 别名时必须只接受同值别名；任意非 rescue source、缺 ID、别名冲突均失败。壳不得静态导入新包组件。 |
| `/pages/meMore/rescueProofForm`、`pages/meMore/rescueProofForm.vue` | `rescue.proof.create` | 旧壳按同一规则解析别名；提交完成后进入 `rescue.proof.list({ rescueId })`，不回领养确认材料。 |
| `pages/meMore/components/PawAdoptionEvidence.vue`、`PawAdoptionProofForm.vue` 的救助分支 | 新救助证实页 | 后续调用方切换应移除救助语义对 Adoption proof 组件的依赖；领养确认仍走 C2 自己的合同。 |

本批总工已串行处理基金入口、小院救助卡片详情和旧 feature 页证实入口；`pages/meMore/components/PawAdoptionEvidence.vue`、`PawAdoptionProofForm.vue` 的领养语义仍由后续 C2 任务负责，其他跨域拆壳不在本批扩大范围。

## 验证

- `node --test packages/rescue/tests/*.test.cjs`：6/6 PASS；覆盖表单反例、重复证实幂等边界、显式 `rescueId` 页面合同和旧 Adoption storage key 禁止。
- `npm run test:governance`：80/80 PASS。
- `npm run check:package:final`：PASS；包体、静态资源、源码/生产包边界均 PASS。
- `npm run check:native-ui`：PASS，225 个源码文件扫描，35 项历史冻结违规未增加。
- `npm run check:icon-usage`：PASS。
- `npm run check:typography`：PASS。
- `npm run check:ui-governance`：PASS。
- `git diff --check`：工作区已有改动未产生 whitespace 诊断；新增文件逐文件检查无 whitespace 诊断。
- `npm run check:routes`：coder 交付时因按约定未改 `pages.tson` 暂为 FAIL，报告四个新增目标页尚未注册；总工已完成串行注册并在下方独立复验通过。
- `npm run build:mp-weixin`：PASS；主包 `1,567,897 bytes / 1,531.1 KiB`，`packages/rescue` `56,773 bytes / 55.4 KiB`，全量 `4,427,747 bytes / 4,324.0 KiB`；主包低于 1.5 MiB 目标，meMore `1,665,095 bytes / 1,626.1 KiB` 低于 2 MiB 硬上限但超过质量建议。
- 微信开发者工具运行时：已在用户手动打开的 `unpackage/dist/dev/mp-weixin` 窗口完成只读路由冒烟；每条路线清空 Console 后均为 `Errors: 0 / Warnings: 0`。

## 总工串行集成复核

- [x] 已将 `pages/fund/index`、`pages/detail/index`、`pages/proof/list/index`、`pages/proof/create/index` 注册到既有 `packages/rescue` 分包；`npm run check:routes` 通过（69/69）。
- [x] 已将 `/pages/meMore/rescueProofList`、`/pages/meMore/rescueProofForm` 收敛为轻量兼容壳，使用同包 `buildRoute` 与严格的 rescue 域/ID 别名校验；旧壳不再静态导入旧 Adoption proof 组件，不把 `legacyRoutes.ts` 引入 meMore 分包，避免主包回流。
- [x] 已将个人中心救助基金入口、旧小院救助列表详情卡和旧 feature 页证实入口切换到 `rescue.fund`、`rescue.detail`、`rescue.proof.*` 目标合同；未改跨域页面的其他业务职责。
- [x] 独立通过 `git diff --check`、本批 6 项反例测试、治理测试 80/80、路由 69/69、`check:ui`、`npm run build:mp-weixin`、`npm run check:package:final`。最终构建主包 `1,567,897 bytes / 1,531.1 KiB`，全量 `4,427,747 bytes / 4,324.0 KiB`，`packages/rescue` `56,773 bytes / 55.4 KiB`；主包低于 1.5 MiB 目标，meMore `1,665,095 bytes / 1,626.1 KiB` 仍低于 2 MiB 硬上限但超过质量建议。
- [x] 在已打开的微信开发者工具中复验新基金/详情/证实列表/证实表单和旧兼容入口：
  - `/packages/rescue/pages/fund/index` 展示基金统计、状态筛选和真实救助卡片。
  - `/packages/rescue/pages/detail/index?rescueId=rescue-demo-001` 展示公开详情、救助单号和证实入口；无 query 时展示“缺少救助单 ID”明确空态，不回退首条记录。
  - `/packages/rescue/pages/proof/list/index?rescueId=rescue-demo-001` 展示已有证实列表和幂等禁用态；`/packages/rescue/pages/proof/create/index?rescueId=rescue-demo-001` 展示表单和禁用提交态，未填表、未提交。
  - 旧 `/pages/meMore/rescueProofList`、`/pages/meMore/rescueProofForm` 的合法 rescue 链接分别落到新列表/表单；非 rescue source 留在壳并显示“仅支持救助证实链接”。
  - `/pages/yard/rescueReview` 正常展示旧基金列表；点击首条救助卡后进入 `packages/rescue/pages/detail/index`，保留 `rescue-demo-001`。
  - 运行证据见 `.artifacts/architecture-governance/supervision/PKG-RESCUE-PROOF-FLOW-runtime.md`。本轮只做导航、展示和只读点击，未执行投票、审核、打款、上传或证实提交。
- [x] 运行时验收后仍只保留“路由级冒烟”结论；未宣称 Figma 像素级几何或视觉验收。
