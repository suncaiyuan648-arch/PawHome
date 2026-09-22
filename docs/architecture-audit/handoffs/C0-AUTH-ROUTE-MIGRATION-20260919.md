# C0 AUTH 语义路由迁移交接

日期：2026-09-19

范围：本地小程序认证页面的语义路由迁移与旧页面清理。不接入真实后端、微信真实身份交换、短信发送或实名服务。

## 迁移结果

认证能力已从旧的 `pages/auth` 目录迁移到 `packages/auth` 分包：

| 旧页面 | 新页面 | 职责 |
|---|---|---|
| `/pages/auth/login` | `/packages/auth/pages/login/index` | 登录入口与受限认证续接 |
| `/pages/auth/bindPhone` | `/packages/auth/pages/phone-bind/index` | 手机号输入与短信步骤入口 |
| `/pages/auth/smsVerify` | `/packages/auth/pages/sms-verify/index` | 短信验证码校验 |
| `/pages/auth/realName` | `/packages/auth/pages/real-name/index` | 实名信息与本地结果选择 |
| `/pages/auth/verifyResult` | `/packages/auth/pages/verification-result/index` | 实名结果展示与后续入口 |

`pages.json` 只保留 `packages/auth` 的五个新页面注册。旧页面和旧的登录专用按钮组件已删除；生产源码中不再存在 `/pages/auth/*` caller。认证页面继续使用 `PAWHOME_ACTOR_SESSION` 本地会话合同，未引入真实后端服务。

## 边界与 UI 处理

- `PawPrimaryButton` 下沉到 `packages/auth/pages/login/components`，避免旧 `pages/auth` 私有组件目录残留。
- 登录页保留 `PawPageNav`；手机号绑定和短信验证页改用 `PawPageNav`，移除页面直接读取 `getMenuButtonBoundingClientRect()` 的旧导航实现。
- 实名页与结果页继续复用 `PawPageNav`/`PawFlowResult`，未新增原生状态栏、微信胶囊或底部系统条绘制。
- 删除认证页面对应的 native UI 历史基线豁免。

## 验收

```text
auth-session.test.cjs             3/3 PASS
route-contracts.test.cjs          29/29 PASS
check:routes                      PASS（72 registered / 72 source）
check:boundaries                  PASS
check:native-ui                   PASS
check:ui-governance               PASS
build:mp-weixin                   PASS
check:package:final               PASS
git diff --check                  PASS
```

最终包体记录：主包 `1,572,500 / 1,572,864 bytes`，余 `364 bytes`；全量包体 `4,121,876 bytes`。认证分包约 `22.3 KiB`。

旧文件删除清单：

- `pages/auth/login.vue`
- `pages/auth/bindPhone.vue`
- `pages/auth/smsVerify.vue`
- `pages/auth/realName.vue`
- `pages/auth/verifyResult.vue`
- `pages/auth/components/PawPrimaryButton.vue`
- `pages/auth/components/PawPrimaryButton 2.vue`

运行时仍需由总工程师在已打开的微信开发者工具窗口执行新登录入口、手机号绑定、短信返回和实名结果的本地路径冒烟；本批不执行真实登录、短信、实名或其他业务提交。
