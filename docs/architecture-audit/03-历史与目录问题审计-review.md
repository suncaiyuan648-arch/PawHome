# 03-历史与目录问题审计复核

复核对象：`docs/architecture-audit/03-历史与目录问题审计.md`。复核基线为当前 `HEAD` `80fef9f3c24066e7e7b50f2e9a374f60dd22582e`（2026-09-08）。已阅读 `AGENTS.md`、`pages.json`，并针对页面、关键组件和路由调用重新检查当前源码；Git 统计逐文件使用 `git log --all --follow` 复算。

## confirmed

- 覆盖统计正确：当前 `pages/**/*.vue` 为 63 个，`components/**/*.vue` 为 107 个；`pages.json` 为主包 5 个、13 个分包、分包页面 58 个，共 63 个。路由与源码集合比较结果为：配置缺源码 0、源码未注册 0、重复路由 0。`components/CustomTabber/index.vue`、`components/WhtNoticeBar/index.vue` 等目录组件已包含在 107 个内。
- 历史表逐行正确：对 63 个页面和 107 个组件共 170 行重新执行 `git log --all --follow --format='%h\t%ad\t%s' --date=short -- <file>`，首次提交、最近提交、日期、subject、提交次数及“引入后无后续修改”标记与原表 170/170 一致，差异为 0。页面无后续修改 11 个，组件无后续修改 37 个，原文列出的名单均正确。
- `git log --all --summary --diff-filter=R -- pages components` 无 rename summary；原文对 `--follow` 局限性的说明成立。
- `pages/yard/yardCats.vue` 的 `roster/status/managed` 分支确实复用 `PawPetRoster`（`pages/yard/yardCats.vue:8-12`），`publish-entry` 分支确有独立导航、`小院猫咪`、`完成创建`及认证弹层（`:15-27`、`:67-69`、`:118-126`）。当前业务代码中的 `state=roster` 调用和 `state=managed` 调用也真实存在。
- `pages/yard/rescueReview.vue` 是包装器，实际为救助基金统计、状态筛选和救助申请卡片（`pages/yard/rescueReview.vue:1-12`、`components/PawRescueReviewPage.vue:3-60`），点击后进入 `feature?mode=rescue-detail`（`components/PawRescueReviewPage.vue:135-140`）。原审计将其标为待产品确认而非已证实错误，判断稳妥。
- `pages/adoption/adoptApply.vue` 确实同时存在 adoption/rescue 两条提交分支：`state=long&source=rescue` 进入 rescue，调用 `createApplication('rescue')` 并携带 `rescueId`；普通分支调用 `createApplication('adoption')` 并携带记录 ID（`pages/adoption/adoptApply.vue:145-150`、`:312-389`）。`components/CustomTabber/index.vue:86-89` 是真实救助入口。
- `pages/adoption/adoptApplySuccess.vue` 确实按 `type/source/sourceType` 解析救助或领养，并根据类型选择 ID、文案和进度页（`pages/adoption/adoptApplySuccess.vue:31-59`）；救助提交跳转证据为 `pages/adoption/adoptApply.vue:349-352`。
- `pages/meMore/adoptionFlow.vue` 确实按 `type/source/sourceType` 在 `PawApplicantRescueFlow` 与 `PawAdoptionFlowFigma` 间选择（`pages/meMore/adoptionFlow.vue:1-18`）。设计文档还明确记录这是普通申请者侧有意共享的统一进度入口（`docs/pages-design/领养流程全链路任务清单.md:101-110`），所以“存在复用”确认，但“必须拆分”不能确认。
- `pages/feature/index.vue` 确实有 `rescue-detail`、`invite`、`album` 三个 mode 和 album 的 `managed=1` 权限门槛（`pages/feature/index.vue:5-12`、`:112-166`、`:374-393`）；原审计列举的救助评审、我的页面、宠物详情调用者均存在。
- `pages/messageDetail/index.vue` 确实按 `type=service/interaction/activity` 渲染三种消息详情（`pages/messageDetail/index.vue:5-34`、`:64-68`），消息中心按行类型调用该路由（`pages/message/index.vue:146-153`）。
- `pages/adoption/extras.vue` 的 `support/quota/quota-detail` 分支、标题和内部明细跳转真实存在（`pages/adoption/extras.vue:5-44`、`:68-72`）；`pages.json:430-435` 还明确注明 mode 复用。
- `pages/meMore/myAssets.vue` 的 `pets/medals/map/new` 分支及 `state=owned` 子状态真实存在（`pages/meMore/myAssets.vue:4-105`、`:137-149`）；`pages.json:198-212` 明确将它描述为个人资产聚合。
- 对照项判断基本正确：评审团 rescue/adoption 是同一列表/详情交互模型（`pages/yard/juryPanel.vue:58-102`、`pages/yard/juryDetail.vue:130-142`、`:217-225`）；`adoptionAudit` 是一个领养审核状态机；`adoption/result` 是结果状态；`feedingDetail` 是同一订单的角色视角；`postFeed?state=alternate` 仍是同一发布表单上下文。

## corrected

- `yardCats` 的“遗留 publish-entry”措辞超出了证据。当前没有业务页面/组件/`utils` 生产调用者，但 `scripts/build-figma-state-matrix.cjs:44-45、:86-89` 明确仍把 `state=publish-entry`、`state=long-list`、`state=status` 作为可复核页面示例；因此正确表述应为“无当前生产调用者、仍有 QA/设计状态入口，是否删除待确认”，不能断言它就是遗留发布动态入口。另，代码的显式白名单是四个 query state，实际 fallback 还会产生第五个 `pageState='long-list'`（`pages/yard/yardCats.vue:210-217`）。
- 原审计关于 `yardCats` 的生产调用者不完整：除 `pages/dynamicDetail/index.vue:251-254`、`pages/commodityDetails/index.vue:81-85`、`pages/me/index.vue:404-406` 外，当前还有 `pages/meMore/myCloudPets.vue:43` 的 `state=roster`，以及 `pages/yard/createCatYard.vue:310-314`、`pages/yard/yardCertify.vue:197-200` 的 `state=managed`。这不改变“复用页面”的结论，但应补齐调用证据。
- `adoptApply` 的复用结论正确，但原审计遗漏了一个实际契约不一致：`state=long` 单独出现时，`longMode` 让页面显示“求助申请”长表单（`pages/adoption/adoptApply.vue:2-5`、`:145-147`），而 `rescueMode` 仍为 false，提交会走 adoption 分支（`:159-169`、`:312-389`）。`scripts/build-figma-state-matrix.cjs:107` 正好使用无 `source=rescue` 的 `state=long` 示例。应修正为“救助入口使用 `state=long&source=rescue`；`state=long` 单独语义未定义且会出现 UI/API 类型错配”，是否为旧 QA 示例待确认。
- `feature` 的“确认是三个不相干页面上下文”作为代码描述成立，但作为“已确认架构错误”过强。`pages.json:243-253` 明确写的是通用功能场景页并通过 mode 承载复用，`docs/design/figma-map.yaml:188-220` 也把 rescue detail 作为当前入口的一部分。因此应改成：“确认存在三个差异很大的 mode 和独立调用者；是否属于不合理聚合/现在拆分仍待产品确认”。不能把有意的通用场景聚合直接判成错误。
- 原审计对 `feature?mode=rescue-detail` 的调用示例不全：救助详情还被 `components/PawAdoptionEvidence.vue:112-114` 和 `components/PawAdoptionProofForm.vue:79-81` 用作 rescue fallback；这两个组件虽然名称含 Adoption，源码实际含 rescue context（`components/PawAdoptionEvidence.vue:99-113`、`components/PawAdoptionProofForm.vue:56-80`）。
- 原审计没有错误的已引用行号；所列 `pages.json`、页面、组件和设计文档范围均能在当前文件中定位。上述修正是措辞/证据完整性修正，不是行号漂移修正。

## missing

- 漏掉了一个高价值目录语义候选：`pages/commodityDetails/index.vue` 的路由目录仍叫 commodityDetails，但 `pages.json:215-225` 和源码 `pages/commodityDetails/index.vue:2-4、:58-69` 都明确实现的是“小院详情”，组件名为 `PawYardDetailFigma`，首页、动态详情和宠物详情也都把它作为小院详情入口（`pages/index/index.vue:453-455`、`pages/dynamicDetail/index.vue:234-236`、`pages/adoption/petDetail.vue:372-375`）。应加入“旧目录命名与业务语义不一致”候选；是否迁移到 `pages/yard/...` 仍需兼容旧链接。
- 漏掉了 rescue 证实页面的目录候选：`pages/meMore/rescueProofList.vue` 与 `pages/meMore/rescueProofForm.vue` 实际只接受 `source=rescue`（两文件分别见 `:16-26`、`:16-24`），并由 `pages/feature/index.vue:468-473`、`components/PawAdoptionEvidence.vue:177-184` 进入。它们放在个人中心扩展分包可能是“用户侧操作”的合理聚合，也可能应归 rescue；至少应列为待确认，而不能只审 adoptApply/adoptionFlow。
- 漏掉了可复核的 QA/设计示例：state matrix 还覆盖 `feature` 的三个 mode（`scripts/build-figma-state-matrix.cjs:52-58`）、`messageDetail` 三个 type、`extras` 三个 mode 和 `myAssets` 四个 mode（`:83-89`）。这些不是生产调用者，不能替代生产证据，但应在“当前仍有示例/验收入口”中注明。
- 漏掉了几类应明确排除“误判为不相干页面”的合理聚合：`pages/yard/createCatYard.vue` 的 cat/dog 是同一建院表单（`:7-8`、`:186-191`）；`pages/yard/addKitten.vue` 的 cat/dog 是同一宠物录入表单（`:273-282`）；`pages/yard/breedPicker.vue` 的 cat/dog 是同一品种选择流程（`:72-89`）；`pages/meMore/shippingAddress.vue` 的 shipping/service 是同一地址管理器（`:4-25`、`:74-87`）；`pages/meMore/browsingHistory.vue` 的 feed/yard 是同一浏览记录页（`:16-23`、`:231-243`）；`pages/commodityDetails/index.vue` 的动态/投喂/回复/统计是同一小院详情及覆盖层状态（`:3-29`、`:51-56`）。这些应列为合理状态/子域复用，不应当作目录错误。
- `pages/user/profile.vue` 模板包含评价、动态、领养、投粮、小院/入驻等 profile tab（`:99-228`），但当前 `profileTabs` 数据实际只初始化了“评价”（`:475-478`），所以不能把模板分支直接当成当前真实用户路由示例；应标为潜在/未接入状态，而非确认的多页面聚合。

## unresolved

- rescueReview 是否应从 `pages/yard` 拆到 rescue，取决于“评审/管理角色聚合”还是“业务域聚合”；当前 `pages.json:456-529`、`docs/design/figma-map.yaml:188-220` 和救助链路文档均支持现状，不能仅凭目录名定性。
- adoptApply/adoptApplySuccess 的救助壳是否应拆出 rescue 入口，不能等同于共享表单组件错误；当前确有跨域提交、成功态和路径语义复用，但共享骨架是合理的。重点应先解决 `state=long` 的类型契约。
- adoptionFlow 明确是普通申请者侧的有意统一入口；feature、messageDetail、extras、myAssets 也都有配置或设计文档支持聚合。它们可以作为拆分候选，但“需要拆分”需由权限、数据加载、分享/埋点边界决定。
- `scripts/build-figma-state-matrix.cjs` 是 QA 状态样例而非生产导航；其相对路径仍指向上级 `PawHome` 目录，且 `:114` 还出现当前未注册的 `/pages/meMore/adoptionProofList`，因此只能作为“曾/仍被验收样例使用”的辅助证据，不能证明线上入口。
- 未扩展复核所有组件的用途/引用次数；本次已核对与 listed route reuse 直接相关的组件证据及 107 个组件的历史统计，未据此对组件架构作额外结论。

结论：原审计的覆盖统计和 170 行 Git 历史表可确认；listed route reuse 的代码事实大多正确。需要修正的是 `yardCats` 的“遗留/无示例”措辞、`adoptApply` 的 `state=long` 隐藏错配、`feature` 被过早定性为不合理聚合，并补充 commodityDetails、rescue proof 页面及实际调用/QA 示例。仅写入本 review 文件，未修改业务源码或其他审计文件。
