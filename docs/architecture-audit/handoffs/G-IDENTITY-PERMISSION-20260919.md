# G-IDENTITY-PERMISSION — 当前批次交接

## 目标

关闭领养进度跨用户读取/奖励、任务聚合冲突归属和登录只写布尔标记三个本地边界缺口；不把本地 mock actor 误报为真实微信后端身份。

## 已交付

- `packages/adoption/pages/progress/index.vue` 为读和奖励动作传入实时 `PAWHOME_ACTOR_SESSION` provider。
- `packages/adoption/services/progress.js` 只接受 applicant 视角，并在奖励前重新确认 applicant 读模型。
- `packages/adoption/services/applicationAdapter.js` 及同目录 actor/condition 合同保留在 adoption 分包，避免约 23 KiB 依赖进入主包；根 `services/domainReads/adoption/applicationAdapter.js` 继续作为跨域 canonical reader。
- `packages/account/services/tasksRuntime.js` 拒绝各业务域 ID、关系、状态别名冲突；稳定 taskId 去重，业务身份冲突整条丢弃。
- `pages/auth/login.vue` 与 `pages/auth/smsVerify.vue` 写入 `{ actor: { id: 'local-user', roles: ['applicant'] } }`；`pages/me/index.vue` 从该会话判断登录，`packages/account/pages/settings/index.vue` 退出清除同一 key。

## 验收

- `npm run test:governance`：**327/327 PASS**，包含跨用户/缺会话、冲突 ID/归属和登录会话静态反例。
- `npm run check:routes`：**78/78 PASS**。
- `npm run check:figma-map`：**45 formal states PASS**。
- `npm run check:ui`、`npm run check:native-ui`、生产构建、资源/边界和 `git diff --check`：PASS。
- `npm run check:package:final`：主包 **1,572,832 / 1,572,864 bytes**，余量 **32 bytes**；全量 **4,145,246 bytes**。

## 后续 coder 约束

1. 任何新增主包依赖前先释放字节，不得放宽 final 门禁。
2. 修改根 actor/condition/application 合同时，同步核对 adoption 分包镜像并重跑 adoption adapter、source boundary 和包体检查。
3. 下一批处理 F03：dynamic 深链、任务和消息到详情的同记录内容一致性；补真实 reader 后再做 DevTools 正向 fixture。
4. 真实微信 code→用户 ID、云端消息 producer、反馈发布/计数、编辑 reader/writer、社交持久策略和新稿视觉仍未完成。
