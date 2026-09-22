# pages / packages 旧页面语义迁移专项验收

日期：2026-09-21。范围只验路由、页面职责、目录归属、旧入口兼容与迁移记录；不以14号业务缺陷代替本次迁移判定，不重新做视觉验收。

## 2026-09-21 返修复验结论

本轮已完成 M01–M03 的代码与记录收口：消息生产列表统一落在 `packages/message/pages/list/index.vue`，四个已删除旧详情/资料地址由 `navigation/legacyRoutes.js` 解析到 canonical contract，06 矩阵新增当前目标/静态/兼容/证据列并修正过期中间路径。`pages/meMore` 与 `pages/yard` 下无引用的迁移残留组件和领养流程资源已删除。

- 当前注册页 **77/77** 与源文件一致；`pages/feature` 不再有生产页面或服务。
- `messageId` 会从旧 `messageDetail` 入口保留到统一通知列表，并在列表中触发同一条持久消息解析链。
- `/pages/user/profile`、`/pages/commodityDetails/index`、`/pages/adoption/petDetail`、`/pages/dynamicDetail/index`（及旧 deepLink 别名）均支持稳定 ID 兼容；缺 ID、冲突别名和未知参数仍 fail-closed。
- 当前治理测试 **375/375** 通过；路由、UI/native、边界与构建门禁需以本轮命令输出为准。模拟器全链、Console、几何与视觉仍不在本专项的通过认定内。

## 返修前初验记录

**旧页物理搬迁/删除基本完成；语义迁移整体仍有尾项，不能标全部完成。**

- 原06矩阵63页：57个待迁移旧页的 `.vue` 和注册已移除；原地保留4个Tab、2个dev页，符合保留方向。
- 当前78个注册页面：4个主包Tab + 70个packages业务页面 + 1个pages/feature通知页 + 3个dev页。共75个业务页面。
- 当前注册与页面源78/78通过；路由清理/合同测试36/36通过；分包边界审计通过（production部分使用现有构建产物，本轮未重构建）。
- 页数增加来自职责拆分，不是旧页面全部还在。组件 `.vue` 不是独立页面，不能将它们计入注册页数量。

证据：`.artifacts/architecture-governance/route-semantic-review/inventory.json`（63行逐一存在性/注册核对）、tests.log、legacy-probes.mjs/json/log。

## 已完成的迁移范围

| 原区域 | 当前落位 | 本次判定 |
|---|---|---|
| meMore | account / adoption / feeding / rescue / address / animal / yard | 原生产页面源和注册已移除；不再以meMore承载各域页面 |
| adoption root | animal详情、adoption申请/结果/奖励、rescue申请/结果 | 按业务对象拆开；原root页面已清理 |
| yard旧页 | yard / animal / adoption审核 / rescue审核 / jury队列 | 多业务拆分后的独立目标已注册 |
| feature/index多mode | rescue详情、account邀请、animal相册 | 原多mode页已删除 |
| citySelect/search/leaderboard | discovery/city-picker、search、ranking | 路由已归位 |
| publishDynamic | dynamic/editor、dynamic/result、feeding/result | 编辑器与结果职责已分开注册 |
| auth / user / dynamicDetail | auth / account / dynamic | 新语义路径已注册，旧页清理 |
| messageDetail | message/list | 初验时存在两套入口；已由返修复验统一，见上方当前事实 |

注意：以上“归位”只表示本次静态迁移范围，不代表该页全部业务和视觉通过。

## 未通过/待收口项

### M01 / P2：消息列表仍被命名为detail，生产通知留在feature，形成两套入口（返修前）

基准06的R04明确指出旧messageDetail是分类列表，要求规范category并迁为通知列表。

当前实际：

1. `packages/message/pages/detail/index.vue` 仍按type=service/interaction/activity渲染整组静态消息，onLoad只消费type，不消费messageId；它不是单条消息详情。
2. `pages/feature/notificationList.vue` 才是读取持久消息、按category筛选和按messageId打开业务目标的生产列表。消息Tab及登录/短信续接仍跳该路径；`navigation/routeContracts.js:144` 仍将notification.list绑定旧feature目录。
3. `navigation/legacyRoutes.js:374–379` 把旧messageDetail导向新message/detail，还允许带messageId。独立解析得到成功URL，但目标页忽略这个ID；新入口和旧入口没有收敛到同一通知流程。

**返修结果：**统一域名选择 `message`；分类列表使用 `list/category`，正常入口、登录续接和 legacy adapter 均指向同一有效列表/消息解析链；旧静态 `detail` 页面及 feature 生产页已删除，视觉节点只作为 QA 参考。

### M02 / P2：旧链接兼容覆盖不足，删除旧注册不等于旧入口迁移验收通过（返修前）

05方案6.3要求核对旧/新深链、冷启动、页面栈，并对外部旧分享/二维码保留兼容或登记失效策略。

本次执行tryResolveLegacyRoute，以下4个基线旧页面均返回UNSUPPORTED_LEGACY_ROUTE：

- `/pages/user/profile?pawId=user-a`
- `/pages/commodityDetails/index?yardId=yard-a`
- `/pages/adoption/petDetail?animalId=animal-a&yardId=yard-a`
- `/pages/dynamicDetail/index?dynamicId=dynamic-a`

旧页面已无注册/源码；解析器本身明确仅覆盖部分跨域热点。App.onLaunch仅对解析成功目标跳转，onShow只有日志。因此不能以“App加了redirect”推断所有旧地址已兼容。原分享是否曾发布/必须保留，需要按实际使用登记，本次不推定存在外部用户受损，也不把某种原生冷启动行为未经实测写成事实。

**返修结果：**四个基线旧入口及旧 dynamic deepLink 别名已逐项登记并实现 resolver 适配；内部 caller 已切 canonical，旧地址只读跳转并保留 ID 校验。运行时冷启动/热启动/返回仍需在已有 DevTools 窗口补证据，不能以静态兼容测试替代该项。

### M03 / P3：迁移矩阵保留过期当前描述，缺本轮逐行状态收口（返修前）

06矩阵仍有“除C1/C2其余目标TODO”“feature/index和领养root仍待治理”等当前口吻，R04与R32–R39等保留原迁移目标，部分中间canonical入口仍写已删除的postFeed/adoptApply。虽然后文覆盖说明补了一部分，但读者无法只看矩阵确认最新状态，消息域的真实分叉尤其被“全迁移完成”遮蔽。

**返修结果：**06 矩阵已增加当前 M01–M03 收口表，修正 R04/R29/R30/R35/R46 的 canonical 目标与兼容口径，旧路径仅保留在来源/历史列。

## 非阻断目录残留（返修前）

返修前发现的 `pages/meMore/components/PawAdoptionFlowFigma.vue`、`PawAdoptionProofForm.vue`、`pages/yard/components/overlay/PawSelectionSheet.vue` 及其仅供旧流程使用的 WebP 资源均已删除；canonical replacement 分别位于 adoption/rescue/animal 分包，生产源码搜索无残留引用。

建议后续确认资产引用后删除或明确历史归档。不要仅因目录仍在，就删除仍被其他组件使用的图片，也不要把组件残留与生产旧页面混计。

## 最终口径

- **可验收保留：**57个旧生产页清理、主要业务域物理归位、当前77/77注册一致、375/375治理测试、当前分包边界。
- **本专项当前未关闭：**仅剩已有 DevTools 窗口中的旧地址冷/热启动、返回和统一消息流程运行证据，以及独立视觉/几何验收；M01–M03 的静态迁移结论已关闭。
- **独立于本次：**14号F01–F06业务问题的最新修复情况本轮未复验，不据本次目录检查新增或撤销业务PASS；视觉/几何继续由逐页验收确认。

本次只记录审查结论与台账，没有移动/删除业务文件或更改路由，没有操作模拟器。
