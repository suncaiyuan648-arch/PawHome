# PKG-AUTH-PRIVATE-COMPONENTS：认证入口私有组件归属审计

日期：2026-09-15  
执行人：治理 coder（Luna / xhigh）  
范围：根 `components/`、`components/auth/`、`pages/auth/**`、生成的 `common/assets.js` 与真实微信分包产物  
状态：已通过总工程师独立验收；未提交、未上传、未发布

## 结论

本批只迁移一个证据闭合且没有资源依赖的认证入口组件：

- `components/PawPrimaryButton.vue` → `pages/auth/components/PawPrimaryButton.vue`
- 唯一生产调用方 `pages/auth/login.vue` 改用 `./components/PawPrimaryButton.vue`
- 组件迁移前后源码 SHA-256 均为 `e3aa961275a984c8747438e57900afc2256b7ebb7747b5575485a42d62fefe30`
- props、emits、模板、脚本、样式、组件名、PawButton API 和运行行为均未改动；只改了调用方的相对 import
- 组件内部仍依赖跨页共享的 `components/base/PawButton.vue`，因此形成合法的 `pages/auth → main` 依赖；没有反向依赖

## 调用方和边界证据

生产源码检索（排除 `unpackage/`、`.artifacts/`、文档）确认：

- `<PawPrimaryButton>` 只出现在 `pages/auth/login.vue` 的微信登录和手机号登录两个按钮。
- `PawPrimaryButton` 的 import 只出现在 `pages/auth/login.vue`；迁移后为 `./components/PawPrimaryButton.vue`。
- 没有 `pages/`、`packages/`、其他分包或根组件的生产 import。
- 没有动态组件名、`resolveComponent`、字符串路径或 `import()` 引用该组件。
- `components/auth/PawRealNamePrompt.vue` 由 `pages/auth/realName.vue`、`pages/yard/catGuide.vue` 和 `pages/yard/createCatYard.vue` 共用，认证/小院边界明确跨域，本批保留。
- `PawCheckbox` 被登录、领养申请、地址/表单和小院弹层等多个业务域使用，本批保留。

真实构建产物边界（`unpackage/dist/build/mp-weixin`）：

```text
pages/auth/login.json
  └─ ./components/PawPrimaryButton
       └─ pages/auth/components/PawPrimaryButton.js
            └─ ../../../components/base/PawButton.js  → main
```

`npm run check:package` 的生产与源码边界报告均为 `crossPackage=0`、`missing=0`、`unresolvedDynamic=0`、`parseErrors=0`。没有 `main → pages/auth` 或 sibling private 依赖。

## common/assets.js 与资源审计

`PawPrimaryButton.vue` 没有图片、字体、静态文件或 `common/assets.js` 资源引用。组件唯一依赖是共享 `PawButton`，无需迁移或复制资源。`common/assets.js` 未修改。

真实产物生成：

- `pages/auth/components/PawPrimaryButton.js`
- `pages/auth/components/PawPrimaryButton.json`
- `pages/auth/components/PawPrimaryButton.wxml`
- 组件没有独立 WXSS 产物
- `pages/auth/login.json` 的 usingComponents 指向 `./components/PawPrimaryButton`

## 包体前后

为得到可复核的同状态差异，本批在同一工作树上做了受控对照构建：先临时恢复根组件路径与旧 import 生成基线，随后恢复迁移状态并再次生成最终产物。对照构建只用于包体测量，源码最终保持迁移状态。

| 指标 | 根组件基线 | 认证分包归属后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,685,757 bytes / 1646.2 KiB | 1,684,687 bytes / 1645.2 KiB | **-1,070 bytes / -1.0 KiB** |
| `pages/auth` | 23,001 bytes / 22.5 KiB | 24,105 bytes / 23.5 KiB | +1,104 bytes |
| 总包 | 3,303,944 bytes / 3226.5 KiB | 3,303,978 bytes / 3226.5 KiB | +34 bytes |

迁移后主包低于 2 MiB 硬上限和迁移期门槛，但距离推荐的 1.5 MiB（1,572,864 bytes）仍差：

```text
1,684,687 - 1,572,864 = 111,823 bytes
```

本批不宣称最终 1.5 MiB 门禁通过。

## 暂缓候选

| 候选 | 当前调用方/归属 | 暂缓原因 |
|---|---|---|
| `components/auth/PawRealNamePrompt.vue` | `pages/auth` + `pages/yard` | 实名提示同时服务认证和小院建院链路；下沉到 `pages/auth` 会造成 `pages/yard → pages/auth` 私有依赖，违反边界 |
| `components/base/PawCheckbox.vue` | `pages/auth`、`pages/adoption`、地址/表单、小院弹层 | 跨域共享基础组件，不能按登录页单一调用判断 |
| `components/base/PawButton.vue` | 多个页面、反馈/表单/底栏/弹层 | 是 `PawPrimaryButton` 的共享基础依赖，必须保留主包 |
| `components/PawPageNav.vue`、`components/PawIcon/PawIcon.vue` | 多个页面与分包 | 全局导航/图标基础设施，受 native UI 和图标治理约束，不属于认证私有组件 |
| `components/PawFlowResult.vue`、`components/overlay/PawBottomSheet.vue` | 认证 + 其他流程/页面 | 跨流程共享容器，需按公共组件治理，不随认证页搬运 |

## 验证结果

本批已执行并通过：

- `git diff --check`
- `npm run test:governance`：79/79 PASS
- `npm run check:routes`：65/65 PASS
- `npm run check:ui`：PASS
- `npm run check:native-ui`：PASS（214 source files，35 项历史冻结违规未增加）
- `npm run check:package`：PASS（size/assets/production-source boundaries 全部 PASS）
- `npm run build:mp-weixin`：PASS；最终生产产物已恢复为迁移后的 `pages/auth/components` 路径

总工程师已在用户手动打开的 `/unpackage/dist/dev/mp-weixin` 开发者工具窗口中通过 `wx.redirectTo({ url: '/pages/auth/login' })` 验证认证入口：页面路径为 `pages/auth/login`，页面渲染“让每一次相逢都有意义”“微信登录”“手机号登录”及协议文案；未点击真实登录按钮。清空 Console 后，调试器保持 `Errors: 0`；清空前仅见自动热重载和 `wx.getSystemInfoSync` 弃用提示。未做几何、视觉或 Figma 像素验收。

## 7. 总工程师独立验收

- 迁移前后源码 SHA-256 均为 `e3aa961275a984c8747438e57900afc2256b7ebb7747b5575485a42d62fefe30`；生产差异只有 `pages/auth/login.vue` 的相对 import，未改变组件 API、状态、路由或样式。
- 独立复跑 `git diff --check`、`npm run test:governance`（79/79）、`npm run check:routes`（65/65）、`npm run check:ui`、`npm run check:native-ui`、`npm run check:package`、`npm run build:mp-weixin` 与 `npm run verify:ui`，均通过。
- 受控对照构建遗留的临时文件 `pages/auth/login 2.vue` 被路由门禁识别为未注册页面；总工已删除该临时文件，并在清理后重新通过路由检查、生产构建及包体门禁，最终源码不含该文件。
- 当前迁移报告主包为 `1,684,687 bytes / 1645.2 KiB`，总包 `3,303,978 bytes / 3226.5 KiB`；显式执行 `npm run check:package:final` 按预期失败（`1,684,687 > 1,572,864`），随后恢复 migration 报告。距离推荐 1.5 MiB 仍差 `111,823 bytes`，因此本批不能宣称最终包体目标完成。
- 运行时仅做认证入口渲染和 Console 清空检查，没有执行登录、实名、支付或其他真实业务提交。

## 交付边界

没有修改：

- `pages.json`、路由 URL、认证状态机、storage key、登录/实名数据行为
- 组件 props、events、template、script、style、PawButton API 或资源字节
- `components/auth/PawRealNamePrompt.vue`、共享 `PawButton`/`PawCheckbox` 默认值
- Figma map、native legacy baseline、上传、发布或真实认证提交
