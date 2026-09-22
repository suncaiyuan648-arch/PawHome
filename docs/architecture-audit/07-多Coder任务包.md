# 多 Coder 治理任务包

> 2026-09-15 执行增补：[11 采纳建议治理增补计划](./11-采纳建议治理增补计划.md) 已纳入本次治理；G-ID 的范围、依赖和验收补充本文。当前 Figma 来源以 [新旧节点映射](../design/figma-node-migration-20260915.md) 与 figma-map.yaml 为准，历史核对不视为新稿 UI PASS。

对应 [实施方案](./05-页面职责与分包治理实施方案.md) 与 [63 页迁移矩阵](./06-全量路由迁移与验收矩阵.md)。本文件是可下发的工作说明；用户已于 2026-09-11 授权启动 Luna coder，实际任务状态与总工验收结论见 [08 执行台账](./08-治理执行与总工验收台账.md)，跨域数据合同见 [09](./09-跨域数据与集成合同.md)。

> **当前已收口的 C0 子批次（2026-09-19）**：认证、账号设置、投喂订单详情及其 90/91/92 状态、发布选订单、领养选猫和救助评审 wrapper 已完成迁移验收并删除旧生产页。后续 coder 不得重新创建这些旧路由；需要扩展状态时，沿用对应 canonical route/state，并先更新 06 矩阵与 08 台账。

## 1. 组织方式与必须先做的决定

由一名集成 owner（C0）维护全局合同/路由注册/构建与资源规则，业务 coder 按域拆页和迁移，独立 QA owner（C9）复核。C1–C8 是工作角色，不要求同时安排八个人；3–4 名 coder 可以分波次领取多个角色。

**开工顺序：C0-A → C0-B → 域内并行 → C0 集成 → C9 验收。** 在 C0-B 尚未支持 `packages/` 之前，只能准备设计映射、合同用例和业务拆分草案，不能开始大规模迁路由。

不要对整个业务域做一次超大目录移动。建议每个 PR 对应 1–3 个相关页面/状态边界；语义拆分、依赖搬迁、布局重做分成可回滚的增量。最终旧路径兼容与内部调用更新必须与目标注册形成一个原子发布单元。

### 1.1 所有权

| Owner | 独占合入范围 | 可读取的协作范围 |
|---|---|---|
| C0 | `pages.json`、`manifest.json`、`package.json`/lock、构建脚本、全局 navigation/services 合同、Figma map、共享组件公共 API、全部跨域旧壳 | 全仓 |
| C1 | `packages/rescue/**` | 旧救助实现、feature 救助分支、救助 storage |
| C2 | `packages/adoption/**` | 旧领养实现、申请/成功/进度/审核分支、奖励服务 |
| C3 | `packages/yard/**` | 旧小院详情、创建/认证/名册 |
| C4 | `packages/animal/**` | petDetail、addKitten、breedPicker、myCloudPets、feature 相册 |
| C5 | `packages/feeding/**` | 投喂列表/详情、YardFeedPopup、奖励订单合同 |
| C6 | `packages/account/**`、`packages/notification/**`、四 Tab 页面业务内容 | 个人聚合入口与其他域 handoff |
| C7 | `packages/auth/**`、`packages/address/**` | 旧身份/地址组件和 selector caller |
| C8 | `packages/dynamic/**`、`packages/discovery/**` | 动态、搜索、城市、排行、发布分支 |
| C9 | QA 场景/合同测试及复核文档；约定的测试目录 | 全仓及已有开发者工具窗口 |

以下旧文件是**跨域冲突热点，由 C0 最后写兼容壳**：`feature/index.vue`、`meMore/adoptionFlow.vue`、`meMore/myAssets.vue`、`adoption/adoptApply.vue`、`adoption/adoptApplySuccess.vue`、`publishDynamic/postSuccess.vue`、`yard/juryDetail.vue`。C1/C2/C4/C5/C6/C8 从共同基线读取并提取各自分支，禁止同时回写旧文件。

跨页共享或边界组件（包括 `PawPetRoster`、`PawPageNav`、`PawIcon`、`YardFeedPopup`）修改先形成 props/emits/依赖 handoff，由 C0 指定一个作者合入；其他 coder 不复制一套新默认样式规避冲突。`PawAdoptionEvidence` 与 `PawAdoptionProofForm` 已确认只服务 `pages/meMore`，按 PKG-TRIM 交付下沉到该分包组件目录；若后续出现跨域 caller，必须先重新测量依赖归属，再由 C0 决定共享位置。

四 Tab 文件由 C6 修改页面内容；C0 如需全局导航替换，先在 C6 合入后串行完成。C0 不与 C6 同时改同一入口文件。

### 1.2 分支与本地验证

- 每个 coder 使用独立工作树/checkout；分支建议 `codex/governance-<task-id>`。同一目录不得启动多个 dev watcher 或同时跑会清理同一输出目录的构建。
- 基线含当前未跟踪审计文档：开始分工前由集成 owner 确保方案文档已进入所有工作树可见的共同基线；不要在本次方案交付中擅自暂存/提交用户文档。
- `pages.json` 的正式改动由 C0 合入。业务 coder 提交路由片段与样式/旧 alias 说明，在自己的独立工作树可临时合成 QA 配置运行构建；临时文件不作为最终提交，不能覆盖别人的工作树。
- C0 工具任务提供片段合成/校验方式，或直接接受仅新增本域注册项的独立 patch 串行合入；禁止业务 coder 手动整理/重排整个 `pages.json`。
- 必须保留 npm lockfile；业务迁移不升级 uni-app/Vue/Vite，不顺手迁 TypeScript 或替换 UI 库。
- Git 冲突以业务合同/共享 API 为依据解决，不用整文件取 theirs/ours；重新验证调用方和产物归属。

### 1.3 统一交接内容

每个任务提供一个可评审的 handoff，建议放 `docs/architecture-audit/handoffs/<task-id>.md`，只记录稳定实现事实。QA 日志/截图/包报告放 `.artifacts/`。

```text
taskId / owner / baseCommit / implementedCommit
矩阵行 Rxx：旧入口 → 目标 route name/path → 参数转换
Figma file_key/node_id：使用的设计文档，live/local/missing 状态
共享 API 变更：props/emits、导航/服务合同、受影响 caller
路由注册片段：生产页、兼容页、dev-only，默认样式与 fallback
调用方变更清单：本域已更新；跨域交 C0/C6 的精确位置和意图
资产：源位置、目标包、动态引用声明、共享原因
本地数据：storage key/version、兼容读取与幂等行为
验证：命令、结果、六项 UI 状态、包体前后字节差
未决项：证据、风险、默认处置、解除条件、下一 owner
回滚：可恢复旧行为的提交单元；是否涉及持久化数据
```

## 2. C0-A：合同、设计索引和路由门禁

**优先级 P0；其他业务迁移的前置。**

输入：`pages.json`、现有路由工具、原 `00–04` 审计、本文三份方案、`figma-map.yaml`、应用/审核/投票/订单 mock API。

交付：

1. 修复 `check-page-routes.cjs` 的 JSON5 读取与项目根路径；接入 `npm run check:routes`。原脚本只检查少数路径，扩展为源码/注册/目标合同/Tab/QA 双向核查。
2. 将 `build-figma-state-matrix.cjs` 的输入输出改为仓库内稳定来源；删除对上级 `PawHome` 路径的隐式依赖，修正不存在的 `adoptionProofList` 示例。
3. 建立轻量 `navigation` 名称/参数/旧入口解析合同，冻结本方案的目标路径；旧业务 type/source/sourceType 冲突有明确失败分支。
4. 固定 ID 合同：applicationId、rescueId、animalId、orderId、reviewItemId、yardId/userId；确定选择器 requestId/eventChannel 和登录续接合同。
5. 明确应用、投票、订单的唯一读写边界：共享层只留必要合同/存储/状态逻辑；fixture 不得随全局导出回流主包。迁移保留旧 key 数据读取。
6. 修设计桥梁：`83:10978` 归救助、rescue 各 state 路径独立、48/49 语义确认、旧统一进度规则标记被新路由取代；给未映射页面列出补 map 任务。
7. 为业务 coder 提供路由注册片段/本地 QA 配置的合成约定，确定共享文件与跨域旧壳的写入 owner。
8. 更新 native/UI/typography/icon 检查的扫描根与页面发现逻辑，覆盖 `packages/**`、新增 services/navigation；用故意违规 fixture 验证不会因目录迁移漏检，禁止增加旧违规豁免。

必须通过的测试：63 源码页面完整覆盖、四 Tab 均在主包；含注释配置可解析；错误 ID/类型冲突/非法 returnTarget 被拒绝；旧 long 救助入口不写领养；多字节 query 正确编码；frame 只控制允许的只读视图或 dev fixture；新 navigation 不导入业务包。

完成证据：路由检查实际 PASS、合同测试结果、更新后的设计映射、分发给 C1–C8 的稳定 API/路径清单。仅提出一个 routes.js 方案不算完成。

## 3. C0-B：包归属、资源管线和预算门禁

**优先级 P0；依赖 C0-A 的 root/路由约定。可与 C9 准备基线用例并行。**

输入：`run-uni.cjs`、`prepare-mp-weixin-package.cjs`、图标生成脚本、生产产物基线、本项目锁定的 uni-app 编译器。

交付：

1. 去掉 `pages/` 硬编码归属判断，使用分包 root 与依赖 owner；识别 `packages/<domain>/pages` 与同包组件/fixture/static。
2. 不误删已由 uni-app 复制的分包 static；去重与路径重写不能生成兄弟包资源引用；未知动态资源必须有清单/失败报告。
3. JSON 包报告：原始 bytes、KiB、main/subpackage/total、Top 文件、main 依赖链、重复资产、目标预算与上次差量。
4. 新建并接入 `check:package-size`、`check:assets`、`check:boundaries`，最终读处理后 `app.json`；不要通过改 root 或漏计目录使报告变小。
5. dev/生产构建资产策略一致可检查；dev-only 入口尽量编译前排除，后处理再做无残留断言。
6. 检查根组件/fixture/static 流入主包的原因，确定第一批净减重 ≥360KiB 的可测实施项；不要许诺未验证的压缩收益。

必须覆盖的构建 fixture：

- 主包引用资源；一个分包专用资源；两个分包共用资源；同内容不同名资源。
- 包内 Vue/JS 的动态图片映射；CSS url；生成图标引用；未知资源引用。
- 新 `packages/` 根；旧 `pages/` 兼容根；dev 包剔除；最后一页迁走后的残留输出。
- 编译后的 JS/WXML/WXSS/JSON 全部资源可解析；包 A 不能指向包 B 私有路径。
- 生产处理执行两次不会路径双重加前缀/误删资产（幂等）；开发热更新新增资源可见。
- 新包内 fake-native、违规字体、未知图标能被现有治理门禁识别；迁到 packages 不使检查扫描数虚假减少。

完成证据：现有页面生产 build PASS；兼容新根的代表页面/fixture 构建通过；精确复算主包和总量；主包不高于 1895.7KiB 基线；最终 1536KiB 门槛有明确阶段切换。临时宽松阶段有退出条件，不能无限保留。

## 4. C1：救助域

**优先级 P1；依赖 C0-A/B。矩阵：R23 救助、R25/26、R31 救助、R47/48 救助、R60/61 救助。**

新建/迁移范围：`packages/rescue/**`。读取旧申请表、成功页、申请者流程、基金列表、feature 救助详情、证实组合与 `rescueStorage`；不回写跨域旧页。

建议分三个 PR：

1. 救助 apply/result/progress；固定域处理器、字段/协议校验、同一 rescueId 返回和刷新。
2. fund/detail/proof list/create；共享人名/头像/媒体/表单组件；缺 ID 空态与证实幂等。
3. rescue review detail；从旧 jury/公开救助页提取投票职责，与任务 metadata/投票仓储关联，申请者和评审者能力明确。

Figma 输入：`83:10978`、`83:14289`、`83:13477`、`83:15264`、`83:17049`；救助进度按本地设计文档现有职责，不直接照搬领养状态。

验收：提交救助只新增 rescue；领养记录数量/状态不变；非法 ID 不回首条 demo；证实追加同一记录并返回刷新；普通申请者没有审核/打款动作；重复投票不改票数；包内代码和素材不从根组合回流。

交接：给 C0 跨域旧壳参数映射；给 C6 救助入口新路由；给 C9 救助 fixture/测试账户关系。不得以新建一个 `rescue/index?mode=...` 重现旧结构。

## 5. C2：领养域

**优先级 P1；依赖 C0-A/B；奖励闭环另依赖 C5 订单合同、C7 地址合同。矩阵：R11、R23 领养、R24、R45、R47–51、R58、R61 领养。**

新建/迁移范围：`packages/adoption/**`。三个实施单元：

1. apply/result/mine/progress/confirmation；去 frame 路由控制，保留信息/申请内容只读视图。选动物默认 sheet；旧独立选择页保留 QA/兼容。
2. review list/detail、jury detail；领养审核列表和详情分开，云家长/院主阶段复用同一审核详情；投票详情与救助分开路由。
3. support/quota/quota detail、reward claim；结果 outcome 统一；接通 reward-claimed 到对应 orderId 的读模型。

共享 `applicationMockApi` 的拆分由 C0 约定接口；C2 不复制一份 storage。业务状态保持当前合法转换，不改重新审批禁用策略。

验收：真实 applicationId 贯穿；重复提交/确认/领取不重复建单；拒绝失败阶段正确；院主确认之后仍等待评审；不能由 outcome/frame 伪造状态；领取成功 CTA 不再 toast“待接入”；选动物、地址选择取消及返回不丢草稿。

额度明细当前是假数据：先保持独立页面职责与明确 demo 合同，不凭旧 `id` 猜测为真实账本 ID。缺真实合同列 API 待接入项，但不影响结构治理。

交接：C0 旧多域壳；C5 奖励订单关联；C7 地址/实名续接；C6 我的领养/审核/额度入口。

## 6. C3：小院域

**优先级 P1；依赖 C0-A/B；与 C4 动物、C7 地址合同协作。矩阵：R27 小院名册、R29、R52–54、R57。**

新建/迁移范围：`packages/yard/**`。小院四态已在 2026-09-15 绑定现路由及新稿精确节点；读取 `docs/pages-design/小院详情.md` 后迁移 `commodityDetails` 与 `PawYardDetailFigma`，保留动态/投喂 tab、评论和统计弹层。

第二单元拆公开名册和管理名册；`publish-entry` 归创建完成引导/QA，保持旧入口安全回退。第三单元迁 onboarding/create/certification，更新动物录入/品种/地区等调用合同。

验收：从首页/动态/动物进入同一 yardId；普通用户不能管理；编辑动物回来名册刷新且滚动合理；地址/位置/语音取消不触发创建；猫狗 species 保留；认证状态不靠数字 query 更改；导航/底栏走现有共享规则。

交接：C4 的动物列表展示 props/emits、animalId/yardId；C7 的 address/region 回填协议；C8 的动态关联小院跳转；C0 共享 PawPetRoster 改造请求。

## 7. C4：动物域

**优先级 P1；依赖 C0-A/B；C3 冻结名册合同后可完整联调。矩阵：R27 owned、R28、R31 相册、R46、R55/56。**

新建/迁移范围：`packages/animal/**`。先动物 detail/editor/breed-picker，再 mine/sponsored/album。

复用现有动物卡、名册、上传、身份等组件；把导航与数据加载从共享名册表现中移出。物理共享层怎么放以包测量为准，禁止兄弟包直接 import 私有组件。

验收：animalId 持续一致；我的动物与云养动物关系分开；领养/投喂动作保留有效上下文；猫狗编辑字段正确；相册的置顶/收藏/隐藏/删除按权限执行，伪造 managed=1 无效；品种选择/取消/补充结果回填。

相册原先图片为本地示例，迁移时明确每只动物的数据边界；不把一个静态数组当成所有动物真实相册。若尚无真实图库服务，保留本地 adapter 并标注运行模式。

交接：C2 领养入口 animalIds；C5 投喂入口 animalId；C3 管理名册刷新；C6 个人动物/云养入口；C0 feature/myAssets 兼容壳。

## 8. C5：投喂与订单域

**优先级 P1；依赖 C0-A/B；订单服务合同需早于 C2 奖励最终联调。矩阵：R17–22、R39 feeding，协作 R51。**

新建/迁移范围：`packages/feeding/**`。先交付同一订单的读模型及关联规则，再迁 mine/yard-orders/order detail/result。

任务边界：

- donor 与 yard-manager 是同一订单的视角/能力，不按 90/91 造两页。
- 92 先核实云养/奖励/履约数据对应；保留安全兼容与 fixture，不凭页面编号猜订单种类。
- 奖励 orderId 与 applicationId 使用同一合同查询；数据不足时返回未接入/不可用状态，不能替换成普通 demo。
- 投喂反馈导航到动态 editor，传 orderId 和场景；返回订单时重新加载反馈。
- 维持批准的投喂弹层交互；`YardFeedPopup` 等共用组件 API 变更交 C0 串行处理。

验收：双列表筛选/排序/详情正常；订单不串用户/小院；伪造 perspective 不获得反馈权；复制订单号和物流读取正确；缺单据不显示另一条 demo；奖励 CTA 命中同一订单。

当前 `YardFeedPopup` 缺少真实 paymentParams 时会提示支付服务未配置。这个边界应如实保留；本地治理不得为了跑通结果页伪造“支付成功”，也不得调用真实付款。真实网络/支付合同在独立生产接入任务验收。

交接：最先给 C2 订单 read model/幂等 claim 合同；再给 C4 投喂入口、C8 反馈编辑器、C6 两类订单入口、C0 90/91/92 兼容/QA 处置。

## 9. C6：个人、消息与主包入口

**优先级 P1/P2；依赖 C0-A/B；入口更新在各业务 route contract 冻结后完成。矩阵：R01–06、R12–16、R27 勋章、R31 invite、R35/36。**

新建/迁移范围：account、notification 与四 Tab 内容。

先迁 messageDetail→notification 分类列表，保留 service/interaction/activity 同页分类；再拆 myAssets 的 medals/map/achievement，与动物分支解除依赖；迁 profile/relations/history/level/report/settings/invite。

四 Tab 只保留摘要/入口与需要的基本交互；删全局 fixture 依赖和不必要的大图，不引入业务分包组合。首页本身的样式变化与入口 URL 迁移分两类提交。

验收：四 Tab 原路径有效；消息未读/分类返回；我的各业务入口命中目标域；profile 的真实可用 tab 不退化；本人/他人上下文正确；历史卡片按 entityType 分发；myAssets 旧路径按上下文映射且无默认 demo 小院；主包实际缩小。

与 C8 的边界：首页内容归 C6，搜索/排行榜/动态目标页归 C8；C8 只提供新 route/参数 handoff，不直接改首页。与 C0 的边界：CustomTabber/native Tab 公共 API 由 C0 统一，四 Tab 页面内容由 C6。

## 10. C7：地址与身份能力

**优先级 P1；依赖 C0-A/B；尽早交付返回与选择器合同。矩阵：R07–10、R40–44。**

新建/迁移范围：auth/address。保留地址数据 key 与 service/shipping 分类；editor 统一新建/编辑入口，不复制两套相同表单。地区选择器与首页城市选择器职责独立。

登录/实名/手机号步骤使用白名单续接目标和 requestId。把绑定手机号/短信页的 native 几何迁回 PawPageNav，不能为了视觉迁移改认证能力本身。

验收：settings 管理地址、reward claim 选地址、create yard 选地区三类 caller 都回填正确；取消/新增/编辑/删除/冷启动无 opener 都有明确行为；旧 eventChannel 桥能把结果交还真正调用方；任意 returnUrl 被拒绝；身份状态不能由 status query 伪造。

交接：C2/C3 的选址/身份续接 API、C6 的设置/登录入口。真实实名服务、短信发送等网络环境缺失时标注本地验证范围，不宣称真实认证成功。

## 11. C8：动态、发现与搜索

**优先级 P1/P2；依赖 C0-A/B；投喂反馈需要 C5 order contract。矩阵：R30、R32–34、R37–39 动态。**

新建/迁移范围：dynamic/discovery。保留动态媒体/评论/语音/回复等批准组件，编辑器关联订单通过 sheet，旧 postFeedOrder 不复制成新独立业务页。

搜索按 scope，同一 query 支持动态/小院/用户；city-picker 只选择首页搜索上下文城市，不负责业务地址；ranking 保留榜单对象/入口。

验收：dynamicId 唯一定位；旧只有 yardId 的分享不被误判成具体动态；关联订单选择/取消/发布草稿恢复；反馈记录关联 orderId；成功页 CTA 到正确动态；搜索 q 编码、历史、空态、排序和返回；排行榜布局重排保持身份标签语义。

交接：C6 首页新路由/参数；C5 反馈编辑器返回规则；C3 动态关联小院；C0 postSuccess 跨域壳和孤立 sheet 的 QA/外部兼容策略。

## 12. C0-C：跨域集成、兼容与评审任务大厅

**优先级 P1；每个域交付即可分批集成，不必等全仓完成。**

1. 串行合入新页面注册与各域 handoff；跨域旧页变轻量兼容壳，既有内部 caller 改新路由。
2. 迁 juryPanel→统一 `jury/queue`，摘要接口带 businessType/reviewItemId；详情一律进入 rescue/adoption 的专用页。不能把完整两域审核组件导回 jury 包。
3. 旧 juryDetail 无 type 时用任务元数据判断，缺记录显示空态；共享轻量仓储不能 import 两域私有页面/fixture。
4. 统一分享 path、消息实体落地、profileNav/navBack、组件内 URL、QA fixture 和 Figma states；检查所有旧字符串的剩余用途。
5. 数据兼容采用双读旧/新结构、单写新结构的一次性转换；有数据迁移的 PR 提供旧格式读测试，不要求用户清缓存。
6. 主包降到 ≤1536KiB 后开启完成门禁；每个 PR 的临时注册片段/旧兼容资产都入账；删除不再必要的构建补丁。
7. 验证分享直达分包的应用/会话初始化，记录缓存/无缓存首开体验；按最终预算选择少量 preloadRule，不在首页预下载全部业务包。

完成证据：内部新调用中无未授权 legacy 入口、所有保留旧分享可达且无循环、选择器桥通过、边界检查/包报告通过、Figma 索引与新注册一致。

## 13. C9：独立 QA 与验收守门

**从第一阶段开始；验证不以“等全改完再看”组织。**

第一批建立：63 页面/模式基线、关键 mock 记录与角色、当前 build/资源/原生守卫结果、已有错误清单。文档明确当前 route 脚本失败、主包高于目标，不把它们归咎于后续 coder。

实现期间每个任务独立复核：

- 路由 source/target/alias 全覆盖；角色/空 ID/冲突参数测试。
- applicationId/rescueId/orderId/reviewItemId 沿链路保持，事件回填与页面栈正确。
- 共享组件没有默认值漂移、兄弟包 import 或 native chrome 新违规。
- dev/build 图片存在且显示比例正确；图片压缩更改检查高 DPR 细节。
- 375px 设计基准关键几何、窄宽设备、键盘/底栏/安全区、长文和弹层。
- 本地 mock 的通过与生产接口/鉴权/支付待接入严格分开记录。

运行时只使用已打开且指向已编译 dev 目录的微信开发者工具窗口；没有窗口就记录待验收并请求手动打开，不自动开窗。不得运行支付/上传/正式发布/真实业务提交。

最终交付：逐行矩阵状态、六项 UI 状态、主包/分包/总量、失败与历史债务差异、可回滚版本。没有 runtime 证据的项目标 `NOT RUN/BLOCKED`，不能写 PASS；静态构建通过不等于 Figma 对齐。

## 14. 建议波次与依赖

| 波次 | 可以并行的任务 | 退出条件 |
|---|---|---|
| W0 | C0-A；C9 准备独立基线 | 参数/旧路由/共享合同冻结，原路由检查可运行 |
| W1 | C0-B；各域补设计文档/节点和组件清单 | `packages/` 与资源管线验证完成，包报告可信 |
| W2 | C1 救助；C2 领养核心；C7 地址/身份；C5 订单合同 | 两域无混写，地址返回与订单接口可被其他 coder 消费 |
| W3 | C3 小院；C4 动物；C5 订单 UI；C2 奖励 | animal/yard、奖励订单、选择器集成通过 |
| W4 | C6 个人/主包入口；C8 动态/发现；C0-C 分批兼容 | 所有内部入口切换，旧分享/返回/QA 映射可验 |
| W5 | C9 最终复核；C0-C 包体和公共组件收敛 | 1536KiB 完成门槛与全链路验收通过 |

资源有限时同波次可排队，但不得跳过前置；已有稳定合同下可提前做纯域实现。C0 每次集成一个域后执行 build/包报告，不并发运行会互相清输出的编译。

## 15. 默认决策与需后续证据的问题

这些项有安全默认，不要求所有 coder 一起等待产品答复：

| 未决项 | 当前默认 | 改变默认需要的证据/owner |
|---|---|---|
| pickCats/postFeedOrder 是否应继续独立生产页 | 核心交互留 sheet，保留 dev；旧生产入口先安全兼容 | 确认外部深链/真实 opener 合同；C2/C8 |
| feedingDetail92 的确切对象 | 保留只读兼容/fixture，先核对数据，不删、不当普通付费单 | order 与云养/奖励关联合同；C5 |
| yardCats publish-entry | 创建完成引导/QA，不新增万能路由 | 真实业务入口、明确 Figma 状态映射；C3 |
| 新拆页没有独立 Figma 画板 | 用现有明确节点/组件提取同一内容；标 shared_reference，不新增未经设计的 UI | 精确 node→职责文档与验收；各域+C9 |
| 旧分享/二维码使用量未知 | 保留轻量注册壳，不设武断删除日期 | 真实使用数据/版本覆盖与失效策略；C0 |
| 真实后端、支付、短信/实名服务缺失 | 保留 mock/未配置状态并明确限制，完成结构与合同治理 | 正式 API/鉴权/服务配置及独立授权；后续接入 owner |
| 资源 CDN 未配置 | 本地分包与依赖拆分先达标 | 稳定 URL、资源权限/缓存/失败策略；C0 |
| AppID 的总代码包适用额度 | 工程先用 ≤8MiB，低于官方两种额度 | 账号类型及工具官方分析；C0 |

## 16. 回滚与合并标准

回滚单位是“一组新页 + 调用方 + 注册 + 旧壳 + 资源 + 合同”的原子 PR，不能只回滚目标页面或只回滚 pages.json。迁移过程采用兼容数据读写，不删除旧 storage；若某阶段确需不可逆数据变更，移出本轮常规路由治理单独评审。

以下任一成立不能合入完成版本：主包 >1536KiB、任何包超平台上限、存在跨兄弟包同步依赖、生产资产丢失、救助/领养串写、query 可提权、关键选择器回填丢失、旧链接不注册、native guard 新增违规、未验证项被标 PASS。

合并说明必须写实际变化、原因、验证及限制，附矩阵行号和包体差量。禁止仅写“完成页面重构”“已对齐 Figma”而没有相应证据。

## 17. 增补任务包派发（2026-09-15）

以 [11](./11-采纳建议治理增补计划.md) 为逐项验收定义，以下进入现有 owner 的下一未实施批次：

- C0-A/C0-C：G-ACTOR 可信 actor/能力合同、任务摘要合同及跨域路由提案；公共写操作必须检查能力，不仅在页面隐藏按钮。
- C1：G-RESCUE-LISTS/STATE，在已验收基金/详情/证实之上补本人列表与评审历史，不能重建同一 storage。
- C2：G-ADOPTION 条件审核/文案与 G-RESUBMIT 决策包；配合 C5 实现奖励能力与幂等。
- C3/C4：G-MANAGEMENT，小院编辑职责与动物对象权限，优先清理 managed/state 可提权。
- C5：G-ORDER、G-FEEDBACK 合同；先交类型能力/用户可见性/策略版本/去重键，再交 UI。
- C6：G-TASKS 聚合与本人资料 editor、G-DEEPLINK；首页新服务版只作精确参考，任务不新增 Tab。
- C7：配合可信身份、实名和登录续接，恢复页面不重放业务提交。
- C8：G-SOCIAL 与 G-FEEDBACK；补搜索动态结果设计缺口，保留旧结果功能直到新设计明确。
- C9：A01–A12 增补行反例与六项 UI 证据；跨角色测试在每域交付时执行。

交付必须标 G-ID + A/R 行号、改动范围、字段/路由增量、mock 限制、测试和回滚。设计或业务决策待定时先交决策成果，不能私自开放能力。
