# C0 yard forms route migration · 2026-09-20

## Scope

本批清理两个旧小院表单路由：动物资料录入/编辑与小院认证。保留 `pages/dev/*` 作为开发专用页面；不接入真实后端，不执行真实提交、上传或认证写入。

| 旧路由 | canonical 路由 | 职责与参数 |
|---|---|---|
| `/pages/yard/addKitten` | `/packages/animal/pages/editor/index` | 动物新建/编辑统一表单；`yardId` 必填，`species=cat/dog`，编辑时可传 `animalId`；保留状态、价值、品种、性格、性别、生日、绝育、疫苗和描述等状态。 |
| `/pages/yard/yardCertify` | `/packages/yard/pages/certification/index` | 小院认证表单与本地设计状态；`yardId` 必填；97/98/99 仅作为设计/QA 状态，不进入生产路由合同。 |

## 安全边界

- `pages.json` 移除旧 `pages/yard` 表单注册，注册 `packages/animal/pages/editor/index` 与 `packages/yard/pages/certification/index`。
- 生产 caller 使用 canonical 路径；管理名册的添加动物入口传 `species + yardId + yardName`，认证入口传 `yardId + yardName`。
- 两个 canonical 页面均使用 `PawPageNav`，不直接读取原生胶囊几何、不绘制状态栏/胶囊。
- `onSave` 与 `onSubmit` 在缺少 `yardId` 或 writer 未接入时 fail-closed，只提示“暂不可用”，不伪造保存成功、不重定向到已认证名册。
- 旧 `.vue` 源文件已删除；`pages/dev/*` 保持注册和源码可用。

## 验收

- `tests/governance/c0-route-cleanup.test.cjs` 覆盖旧路由/源码删除、canonical 注册、PawPageNav 和 fail-closed 写动作。
- 迁移后的认证页面未保留 `getMenuButtonBoundingClientRect`、手绘导航或 H5 状态栏资产。
- 本批不包含真实后端、云存储或线上认证写入。
