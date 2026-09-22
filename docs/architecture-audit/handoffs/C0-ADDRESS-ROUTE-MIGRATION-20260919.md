# C0 地址语义路由迁移交接

- 日期：2026-09-19
- 范围：`pages/meMore` 地址列表、地址编辑、地区选择四个旧生产入口
- 约束：仅保留本地/mock 地址与事件桥，不接真实后端，不执行真实业务写入

## 结果

| 旧页面 | canonical 页面 | 处理 |
|---|---|---|
| `pages/meMore/shippingAddress.vue` | `packages/address/pages/list/index.vue` | shipping/service 两类地址统一由 address 分包列表承载，保留 manage/select、空态、删除和回填状态 |
| `pages/meMore/addShippingAddress.vue` | `packages/address/pages/editor/index.vue?kind=shipping` | 与服务地址编辑归并，`addressId` 区分新建/编辑 |
| `pages/meMore/addServiceAddress.vue` | `packages/address/pages/editor/index.vue?kind=service` | 与收货地址共享实体表单，保留服务地址字段上下文 |
| `pages/meMore/regionSelector.vue` | `packages/address/pages/region-picker/index.vue` | 统一省市区、城市、街道选择，保留 `initRegion`/`regionSelected` 事件桥 |

私有地址组件已随职责迁移到 `packages/address/components`。设置页、地址选择卡、地址表单和小院/投喂相关调用方已切换 canonical 路由；旧 `pages/meMore` 页面、注册和生产路径均已删除。`pages/dev/*` 未修改。

## 路由与边界

- `navigation/routeContracts.js` 原有 `address.list`、`address.editor`、`address.regionPicker` contracts 作为唯一目标路径来源。
- `address.list` 的选择模式显式携带 `intent=select`、`requestId` 和可选 `addressId`；不使用任意 return URL 作为业务路由目标。
- 编辑器通过 `kind` 复用表单，`addressSaved` 事件桥保持；地区选择通过 `initRegion`/`regionSelected` 回填。
- 旧页面源文件和 `pages.json` 注册已移除，没有引入真实服务、支付、提交或外部写入。

## 验证

```text
npm run check:routes                         PASS（70 registered / 70 source）
node --test tests/governance/c0-route-cleanup.test.cjs tests/governance/route-contracts.test.cjs 25/25 PASS
npm run check:ui                             PASS
git diff --check                             PASS
```

本批未重启或自动打开微信开发者工具，也未执行完整构建；运行时交互、几何和视觉验收由总工在已有 DevTools 窗口中统一复验。
